export default function Settings() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Settings</h2>
        <p className="text-sm text-slate-500 mt-1">
          Manage your account and system preferences.
        </p>
      </div>

      {/* Account Settings */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">
            Account Settings
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Update your account information.
          </p>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              placeholder="Enter your full name"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 
              focus:outline-none focus:ring-2 focus:ring-blue-500 
              focus:border-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 
              focus:outline-none focus:ring-2 focus:ring-blue-500 
              focus:border-blue-500 transition"
            />
          </div>

          <button className="px-5 py-2.5 bg-blue-600 text-white rounded-lg 
            font-medium hover:bg-blue-700 transition shadow-sm">
            Save Changes
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">
            Notifications
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Choose which notifications you want to receive.
          </p>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-700">
                Email Notifications
              </p>
              <p className="text-sm text-slate-500">
                Receive important updates through email.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-slate-300 rounded-full peer
                peer-checked:bg-blue-600
                after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                after:bg-white after:rounded-full after:h-5 after:w-5
                after:transition-all peer-checked:after:translate-x-5">
              </div>
            </label>
          </div>

          <div className="border-t border-slate-100 pt-5 flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-700">
                System Notifications
              </p>
              <p className="text-sm text-slate-500">
                Get alerts about system activity.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-slate-300 rounded-full peer
                peer-checked:bg-blue-600
                after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                after:bg-white after:rounded-full after:h-5 after:w-5
                after:transition-all peer-checked:after:translate-x-5">
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">
            Appearance
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Customize how the system looks.
          </p>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-700">Theme</p>
              <p className="text-sm text-slate-500">
                Select your preferred interface theme.
              </p>
            </div>

            <select
              className="px-4 py-2.5 rounded-lg border border-slate-300 
              bg-white text-slate-700 focus:outline-none 
              focus:ring-2 focus:ring-blue-500"
            >
              <option>Light</option>
              <option>Dark</option>
              <option>System Default</option>
            </select>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">
            Security
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Manage your password and account security.
          </p>
        </div>

        <div className="p-6 flex items-center justify-between">
          <div>
            <p className="font-medium text-slate-700">
              Change Password
            </p>
            <p className="text-sm text-slate-500">
              Update your password regularly to keep your account secure.
            </p>
          </div>

          <button className="px-4 py-2.5 border border-slate-300 
            text-slate-700 rounded-lg font-medium 
            hover:bg-slate-50 transition">
            Change Password
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-red-100">
          <h3 className="text-lg font-semibold text-red-600">
            Danger Zone
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            These actions can affect your account permanently.
          </p>
        </div>

        <div className="p-6 flex items-center justify-between">
          <div>
            <p className="font-medium text-slate-700">
              Delete Account
            </p>
            <p className="text-sm text-slate-500">
              Permanently remove your account and all associated data.
            </p>
          </div>

          <button className="px-4 py-2.5 bg-red-600 text-white 
            rounded-lg font-medium hover:bg-red-700 transition">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}