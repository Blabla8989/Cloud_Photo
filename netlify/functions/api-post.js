const cloudinary = require("cloudinary").v2;
const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET });
if (getApps().length === 0) {
    initializeApp({ credential: cert({ projectId: process.env.FIREBASE_PROJECT_ID, clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : "", }) });
}
const db = getFirestore();

exports.handler = async (event, context) => {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };
    try {
        const data = JSON.parse(event.body);
        const { image, mimeType, caption, userId, userName, action, bio, postId } = data; 
        if (!userId) return { statusCode: 401, body: JSON.stringify({ message: "Chưa xác thực!" }) };

        if (action === "update_profile") {
            let avatarUrl = null;
            if (image) { const res = await cloudinary.uploader.upload(`data:${mimeType};base64,${image}`, { folder: "football_avatars", transformation: [{ width: 300, height: 300, crop: "fill" }] }); avatarUrl = res.secure_url; }
            const updateData = {}; if (avatarUrl) updateData.avatar = avatarUrl; if (bio !== undefined) updateData.bio = bio;
            await db.collection("users").doc(userId).set(updateData, { merge: true });
            return { statusCode: 200, body: JSON.stringify({ message: "Thành công!", avatar: avatarUrl }) };
        }

        if (action === "delete_post") {
            const postRef = db.collection("football_posts").doc(postId);
            const docSnap = await postRef.get();
            if (!docSnap.exists || docSnap.data().userId !== userId) return { statusCode: 403, body: JSON.stringify({ message: "Lỗi quyền!" }) };
            await postRef.delete();
            return { statusCode: 200, body: JSON.stringify({ message: "Đã xóa!" }) };
        }

        const res = await cloudinary.uploader.upload(`data:${mimeType};base64,${image}`, { folder: "football_network", transformation: [{ quality: "auto" }] });
        const postRef = await db.collection("football_posts").add({
            content: caption || "", image_url: res.secure_url, userId, userName, likes: 0, commentCount: 0, timestamp: FieldValue.serverTimestamp()
        });
        return { statusCode: 200, body: JSON.stringify({ postId: postRef.id }) };
    } catch (error) { return { statusCode: 500, body: JSON.stringify({ message: "Lỗi server: " + error.message }) }; }
};