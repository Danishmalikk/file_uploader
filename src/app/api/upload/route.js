// import { v2 as cloudinary } from "cloudinary";
// import { NextResponse } from "next/server";

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// export async function POST(req) {
//   try {
//     console.log("data coming in req", req.body)

//     const formData = await req.formData();
//     const file = formData.get("file");

//     if (!file) {
//       return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
//     }

//     const bytes = await file.arrayBuffer();
//     const buffer = Buffer.from(bytes);

//     const result = await new Promise((resolve, reject)=> { 
//       const uploadStream = cloudinary.uploader.upload_stream(
//         {resource_type: "video"}, 
//         (error, result) => { 
//           if(error) return reject(error);
//           resolve(result); 
//         }
//       ); 
//       uploadStream.end(buffer); 
//     })
//     return NextResponse.json({url: result.secure_url}); 
//   } catch (err) {
//     console.error("Unexpected error:", err);
//     return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
//   }
// }
