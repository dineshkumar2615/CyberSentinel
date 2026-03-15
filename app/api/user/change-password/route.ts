import { auth } from "@/auth";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        const session = await auth();

        if (!session || !session.user) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const { oldPassword, newPassword, confirmPassword, step } = await req.json();

        await dbConnect();

        // ── STEP 1: Verify Old Password ───────────────────────────────────────
        if (step === 'verify') {
            if (!oldPassword) {
                return NextResponse.json({ message: "Current password required" }, { status: 400 });
            }

            const user = await User.findOne({ email: session.user.email }).select("+password");
            if (!user) {
                return NextResponse.json({ message: "User not found" }, { status: 404 });
            }

            const isMatch = await bcrypt.compare(oldPassword, user.password);
            if (!isMatch) {
                return NextResponse.json({ message: "Invalid current password" }, { status: 400 });
            }

            return NextResponse.json({ message: "Password verified" }, { status: 200 });
        }

        // ── STEP 2: Update Password ──────────────────────────────────────────
        if (step === 'update') {
            if (!newPassword || !confirmPassword) {
                return NextResponse.json({ message: "New password fields required" }, { status: 400 });
            }

            if (newPassword !== confirmPassword) {
                return NextResponse.json({ message: "Passwords do not match" }, { status: 400 });
            }

            if (newPassword.length < 8) {
                return NextResponse.json({ message: "Password must be at least 8 characters" }, { status: 400 });
            }

            // Also re-verify old password for final confirmation if provided (optional but safer)
            const user = await User.findOne({ email: session.user.email }).select("+password");
            if (!user) {
                return NextResponse.json({ message: "User not found" }, { status: 404 });
            }

            if (oldPassword) {
                 const isMatch = await bcrypt.compare(oldPassword, user.password);
                 if (!isMatch) {
                     return NextResponse.json({ message: "Invalid current password" }, { status: 400 });
                 }
            }

            // Hash new password
            const hashedNewPassword = await bcrypt.hash(newPassword, 12);

            // Update record
            user.password = hashedNewPassword;
            await user.save();

            return NextResponse.json({ message: "Password updated successfully" }, { status: 200 });
        }

        return NextResponse.json({ message: "Invalid step" }, { status: 400 });

    } catch (error: any) {
        console.error("Change password error:", error);
        return NextResponse.json(
            { message: "An internal error occurred" },
            { status: 500 }
        );
    }
}
