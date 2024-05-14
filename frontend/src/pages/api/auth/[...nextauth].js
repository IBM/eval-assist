import NextAuth from 'next-auth'

export const authOptions = {
  providers: [
    {
      id: process.env.AUTH_PROVIDER_ID,
      name: process.env.AUTH_PROVIDER_NAME,
      type: 'oauth',
      clientId: process.env.AUTH_CLIENT_ID,
      clientSecret: process.env.AUTH_CLIENT_SECRET,
      wellKnown: process.env.AUTH_WELL_KNOWN,
      idToken: true,
      // checks: ['none'], // use this to prevent prepriam from throwing weird errors
      profile(profile) {
        console.log('provider profile: ', profile)
        return {
          id: profile.uniqueSecurityName,
          name: profile.name,
          email: profile.emailAddress,
        }
      },
    },
  ],
  callbacks: {
    async jwt({ token, profile }) {
      if (profile) {
        console.log('[nextauth] jwt: profile: ', profile)
        token.name = profile.name
        token.email = profile.emailAddress ?? profile.email

        // from workbench-ui
        // hook to add data to token before returning:

        // make api request to get roles
        // const res = await fetch(
        //   `${process.env.BACKEND_URL}/users?username=${encodeURIComponent(
        //     profile.emailAddress
        //   )}`
        // );

        // const results = await res.json();
        // token.roles = results[0].roles;
      }
      return token
    },

    async session({ session, token }) {
      // session.user.roles = token.roles;
      session.user.username = token.username
      session.user.email = token.email
      return session
    },
  },
}

export default NextAuth(authOptions)
