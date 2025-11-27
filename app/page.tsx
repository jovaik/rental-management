import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              R
            </div>
            <span className="text-2xl font-bold text-gray-900">
              Rental Management
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/login"
              className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/onboarding"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Modern Rental Management
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              for Your Business
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            The complete platform to manage your rental business. From vehicles
            and properties to boats and equipment - all in one place.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/onboarding"
              className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
            >
              Start Free Trial
            </Link>
            <Link
              href="#features"
              className="w-full sm:w-auto px-8 py-4 border-2 border-gray-300 text-gray-700 text-lg font-semibold rounded-lg hover:border-gray-400 transition-colors"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Everything You Need
          </h2>
          <p className="text-xl text-gray-600">
            Powerful features to streamline your rental operations
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Feature 1 */}
          <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center text-3xl mb-4">
              🚗
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Multi-Type Support
            </h3>
            <p className="text-gray-600">
              Manage vehicles, properties, boats, equipment, and experiences all
              from one platform.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 bg-purple-100 rounded-lg flex items-center justify-center text-3xl mb-4">
              📅
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Smart Booking
            </h3>
            <p className="text-gray-600">
              Intuitive booking system with calendar view, availability tracking,
              and automated confirmations.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 bg-green-100 rounded-lg flex items-center justify-center text-3xl mb-4">
              💳
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Payment & Invoicing
            </h3>
            <p className="text-gray-600">
              Automated invoice generation, payment tracking, and financial
              reporting.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 bg-yellow-100 rounded-lg flex items-center justify-center text-3xl mb-4">
              👥
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Customer Management
            </h3>
            <p className="text-gray-600">
              Complete customer profiles with document management and booking
              history.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 bg-red-100 rounded-lg flex items-center justify-center text-3xl mb-4">
              🔒
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Secure & Isolated
            </h3>
            <p className="text-gray-600">
              Complete data isolation for each tenant with enterprise-grade
              security.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 bg-indigo-100 rounded-lg flex items-center justify-center text-3xl mb-4">
              📊
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Analytics & Reports
            </h3>
            <p className="text-gray-600">
              Real-time dashboards and detailed reports to track your business
              performance.
            </p>
          </div>
        </div>
      </section>

      {/* Business Types Section */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Built for Every Rental Business
            </h2>
            <p className="text-xl text-gray-600">
              Whether you're renting vehicles, properties, or experiences
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 max-w-5xl mx-auto">
            <div className="bg-white rounded-lg p-6 text-center hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-2">🛵</div>
              <p className="text-sm font-semibold text-gray-800">Scooters</p>
            </div>
            <div className="bg-white rounded-lg p-6 text-center hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-2">🚗</div>
              <p className="text-sm font-semibold text-gray-800">Vehicles</p>
            </div>
            <div className="bg-white rounded-lg p-6 text-center hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-2">🏠</div>
              <p className="text-sm font-semibold text-gray-800">Properties</p>
            </div>
            <div className="bg-white rounded-lg p-6 text-center hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-2">⛵</div>
              <p className="text-sm font-semibold text-gray-800">Boats</p>
            </div>
            <div className="bg-white rounded-lg p-6 text-center hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-2">🎭</div>
              <p className="text-sm font-semibold text-gray-800">Experiences</p>
            </div>
            <div className="bg-white rounded-lg p-6 text-center hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-2">🛠️</div>
              <p className="text-sm font-semibold text-gray-800">Equipment</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-center text-white shadow-2xl">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Streamline Your Rental Business?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join hundreds of rental businesses managing their operations with our
            platform
          </p>
          <Link
            href="/onboarding"
            className="inline-block px-8 py-4 bg-white text-blue-600 text-lg font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
          >
            Get Started Now - It's Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                  R
                </div>
                <span className="text-xl font-bold">Rental Management</span>
              </div>
              <p className="text-gray-400">
                The modern platform for rental businesses of all types.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="#features" className="hover:text-white">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/onboarding" className="hover:text-white">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/onboarding" className="hover:text-white">
                    Demo
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/onboarding" className="hover:text-white">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-white">
                    Login
                  </Link>
                </li>
                <li>
                  <Link href="/onboarding" className="hover:text-white">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2024 Rental Management. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
