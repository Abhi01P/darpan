import { cookies } from "next/headers";

export async function GET() {
   try{
      const cookieStore = await cookies();

      cookieStore.set("token", "", {
         httpOnly: true,
         secure: true,
         sameSite: "strict",
         path: "/",
         maxAge: 0,
      });

      cookieStore.set("x-role", "guest", {
         secure: true,
         sameSite: "strict",
         path: "/",
      });

      return new Response(
         JSON.stringify({ message: "Logged out, role set to guest" }),
         {
            status: 200,
            headers: {
            "Content-Type": "application/json",
            },
         }
      );
   } catch (error) {
      console.error("Error during logout:", error);
      return new Response(
        JSON.stringify({ error: "Internal Server Error" }),
        { status: 500 }
      );
   }
}
