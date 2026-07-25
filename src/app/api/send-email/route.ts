import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const internalSecret = process.env.INTERNAL_API_SECRET;
  if (!internalSecret) {
    console.error("Fatal: INTERNAL_API_SECRET is not configured.");
    return NextResponse.json(
      { error: "Internal secret not configured" },
      { status: 500 },
    );
  }

  const authHeader = req.headers.get("x-internal-secret");
  if (authHeader !== internalSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    const { to, subject, text } = body;

    if (!to || typeof to !== "string" || !EMAIL_REGEX.test(to)) {
      return NextResponse.json(
        { error: "Invalid recipient email address" },
        { status: 400 },
      );
    }

    if (!subject || typeof subject !== "string" || subject.length > 200) {
      return NextResponse.json(
        { error: "Subject is required and must not exceed 200 characters" },
        { status: 400 },
      );
    }

    if (!text || typeof text !== "string" || text.length > 10000) {
      return NextResponse.json(
        { error: "Text is required and must not exceed 10000 characters" },
        { status: 400 },
      );
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: "bezs <gnvv2002@gmail.com>",
      to,
      subject,
      text,
    });

    return NextResponse.json(
      { message: "Email sent successfully!" },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
