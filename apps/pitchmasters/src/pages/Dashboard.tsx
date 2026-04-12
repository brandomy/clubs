import { Calendar, Users, Mic, Clock } from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-jakarta font-semibold text-tm-blue mb-2">
            Welcome to Pitchmasters
          </h1>
          <p className="text-tm-gray">
            Asia's first startup-focused Toastmasters club. Accelerate your communication skills
            and build your network with fellow entrepreneurs.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Next Meeting */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-6 w-6 text-tm-blue" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-tm-gray truncate">
                    Next Meeting
                  </dt>
                  <dd className="text-lg font-medium text-tm-blue">
                    Nov 15, 2024
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Total Members */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-tm-maroon" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-tm-gray truncate">
                    Active Members
                  </dt>
                  <dd className="text-lg font-medium text-tm-blue">
                    24
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Speeches This Month */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Mic className="h-6 w-6 text-tm-blue" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-tm-gray truncate">
                    Speeches This Month
                  </dt>
                  <dd className="text-lg font-medium text-tm-blue">
                    18
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Meeting Length Avg */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-tm-maroon" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-tm-gray truncate">
                    Avg Meeting Length
                  </dt>
                  <dd className="text-lg font-medium text-tm-blue">
                    75 min
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-jakarta font-medium text-tm-blue">
            Recent Activity
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-tm-gray">
            Latest updates from your club
          </p>
        </div>
        <ul className="divide-y divide-gray-200">
          <li className="px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-10 w-10">
                  <div className="h-10 w-10 rounded-full bg-tm-blue flex items-center justify-center">
                    <Mic className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-tm-blue">
                    Sarah Chen completed Speech #3
                  </div>
                  <div className="text-sm text-tm-gray">
                    "Mastering Your Elevator Pitch" - 2 hours ago
                  </div>
                </div>
              </div>
            </div>
          </li>
          <li className="px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-10 w-10">
                  <div className="h-10 w-10 rounded-full bg-tm-maroon flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-tm-blue">
                    Meeting #47 scheduled
                  </div>
                  <div className="text-sm text-tm-gray">
                    November 15, 2024 at 7:00 PM - 1 day ago
                  </div>
                </div>
              </div>
            </div>
          </li>
          <li className="px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-10 w-10">
                  <div className="h-10 w-10 rounded-full bg-tm-blue flex items-center justify-center">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-tm-blue">
                    New member joined
                  </div>
                  <div className="text-sm text-tm-gray">
                    Alex Kim - Welcome to Pitchmasters! - 3 days ago
                  </div>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
}