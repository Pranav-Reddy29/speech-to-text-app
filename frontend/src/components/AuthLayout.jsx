function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050816] via-[#07112b] to-[#0d1f4f] text-white">

      <div className="container mx-auto min-h-screen flex items-center px-6">

        <div className="grid lg:grid-cols-2 gap-20 items-center w-full">

          {/* LEFT SIDE */}

          <div>

            <div className="flex items-center gap-4 mb-8">
              <img
                src="/logo.png"
                alt="logo"
                className="w-16 h-16 rounded-xl"
              />

              <h1 className="text-6xl font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                VoiceScribe AI
              </h1>
            </div>

            <h2 className="text-5xl font-bold leading-tight mb-6">
              Turn Conversations
              <br />
              Into Text Instantly
            </h2>

            <p className="text-xl text-gray-400 mb-10">
              AI-powered speech transcription platform
              built for creators, students and professionals.
            </p>
          </div>

          {/* RIGHT SIDE */}

          <div className="flex justify-center">
            {children}
          </div>

        </div>

      </div>

    </div>
  );
}

export default AuthLayout;