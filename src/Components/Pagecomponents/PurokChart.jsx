import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Sample data for 6 puroks
const purokData = [
  { name: 'P1', population: 245, households: 62, registered_voters: 180 },
  { name: 'P2', population: 312, households: 78, registered_voters: 230 },
  { name: 'P3', population: 189, households: 45, registered_voters: 142 },
  { name: 'P4', population: 278, households: 71, registered_voters: 205 },
  { name: 'P5', population: 356, households: 89, registered_voters: 267 },
  { name: 'P6', population: 198, households: 52, registered_voters: 151 }
];

const pieData = purokData.map(item => ({
  name: item.name,
  value: item.population
}));

const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0'];

const PurokChart = () => {
  return (
    <div className="w-full p-6 bg-white">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Purok Overview Dashboard</h2>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800">Total Population</h3>
          <p className="text-3xl font-bold text-blue-600">{purokData.reduce((sum, p) => sum + p.population, 0)}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h3 className="text-lg font-semibold text-green-800">Total Households</h3>
          <p className="text-3xl font-bold text-green-600">{purokData.reduce((sum, p) => sum + p.households, 0)}</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <h3 className="text-lg font-semibold text-orange-800">Registered Voters</h3>
          <p className="text-3xl font-bold text-orange-600">{purokData.reduce((sum, p) => sum + p.registered_voters, 0)}</p>
        </div>
      </div>

      {/* Charts Container */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Bar Chart */}
        <div className="bg-gray-50 p-6 rounded-lg border">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Population by Purok</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={purokData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="population" fill="#8884d8" name="Population" />
              <Bar dataKey="households" fill="#82ca9d" name="Households" />
              <Bar dataKey="registered_voters" fill="#ffc658" name="Registered Voters" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-gray-50 p-6 rounded-lg border">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Population Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="mt-8 bg-gray-50 p-6 rounded-lg border">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Detailed Purok Information</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  Purok
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  Population
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  Households
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  Registered Voters
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  Avg. Household Size
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {purokData.map((purok, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {purok.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {purok.population}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {purok.households}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {purok.registered_voters}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(purok.population / purok.households).toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PurokChart;