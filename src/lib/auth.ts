import {betterAuth} from "better-auth";
import {Pool} from "pg";
import {emailOTP} from "better-auth/plugins";
import {nextCookies} from "better-auth/next-js";
import {Resend} from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
  database: new Pool({connectionString: process.env.DATABASE_URL}),
  plugins: [
    emailOTP({
      async sendVerificationOTP({email, otp, type}) {
        if (type !== "sign-in") return;
        await resend.emails.send({
          from: process.env.AUTH_FROM_EMAIL!,
          to: email,
          subject: "Your login code",
          text: `Your 6-digit code is: ${otp}\n\nThis code expires soon.`,
        });
      },
    }),
    nextCookies(),
  ],
});
