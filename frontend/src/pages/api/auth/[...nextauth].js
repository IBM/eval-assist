import NextAuth from 'next-auth'
import Auth0 from 'next-auth/providers/auth0'

// import GoogleProvider from 'next-auth/providers/google'

export default NextAuth({
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    // GoogleProvider({
    //   clientId: process.env.GOOGLE_CLIENT_ID,
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    //   callbacks: {
    //     async redirect({ url, baseUrl }) {
    //       return baseUrl
    //     },
    //   },
    // }),
    Auth0({
      id: 'IBMid',
      name: 'IBMid',
      clientId: process.env.APPID_CLIENT_ID,
      clientSecret: process.env.APPID_CLIENT_SECRET,
      issuer: process.env.APPID_ISSUER,
      profile(profile) {
        return {
          id: profile.emailAddress ?? profile.email,
          name: profile.name,
          email: profile.emailAddress ?? profile.email,
        }
      },
    }),
  ],
})
