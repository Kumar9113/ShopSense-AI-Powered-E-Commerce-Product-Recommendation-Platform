import { NextResponse } from "next/server";
import connectToDB from "@/app/database";
import Product from "@/models/product";

const AI_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

export async function POST() {
  try {
    await connectToDB();
    const products = await Product.find({}).lean();
    const payload = products.map((p) => ({
      id: String(p._id),
      name: p.name || "",
      description: p.description || "",
      category: p.category || "",
      price: Number(p.price || 0),
      imageUrl: p.imageUrl || "",
    }));
    const response = await fetch(`${AI_URL}/catalog/index`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ products: payload }),
      cache: "no-store",
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
