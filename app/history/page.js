"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabaseClient'; // Imports your existing setup
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function HistoryPage() {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .order('created_at', { ascending: true }); // Oldest first for a timeline

    if (error) {
      console.log('Error fetching:', error);
    } else {
      // Convert text moods to numbers for the graph
      // Happy = 10, Neutral = 5, Sad/Angry = 2
      const formattedData = data.map(item => {
        let score = 5; // Default neutral
        if (item.mood === 'happy') score = 10;
        if (item.mood === 'sad') score = 2;
        if (item.mood === 'angry') score = 1;

        return {
          date: new Date(item.created_at).toLocaleDateString(), // e.g. "1/18"
          moodScore: score,
          moodName: item.mood,
          note: item.note
        };
      });
      setChartData(formattedData);
    }
    setLoading(false);
  };

  if (loading) return <div className="p-10 text-white">Loading your history...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-5 flex flex-col items-center">
      
      <div className="w-full max-w-2xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Mood Trends 📈</h1>
          <Link href="/">
            <button className="bg-gray-700 px-4 py-2 rounded hover:bg-gray-600">
              ← Back to Camera
            </button>
          </Link>
        </div>

        {/* THE CHART */}
        <div className="bg-gray-800 p-5 rounded-xl shadow-lg h-64 md:h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" />
              <YAxis domain={[0, 10]} hide /> {/* Hides the numbers on the left */}
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
                itemStyle={{ color: '#fff' }}
              />
              <Line 
                type="monotone" 
                dataKey="moodScore" 
                stroke="#8B5CF6" 
                strokeWidth={3}
                dot={{ r: 6, fill: '#8B5CF6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* LIST OF NOTES */}
        <div className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold text-gray-400">Your Journal</h2>
          {chartData.map((entry, index) => (
            <div key={index} className="bg-gray-800 p-4 rounded-lg flex justify-between items-center">
              <div>
                <p className="font-bold capitalize text-purple-400">{entry.moodName}</p>
                <p className="text-sm text-gray-300">{entry.note || "No note added."}</p>
              </div>
              <span className="text-xs text-gray-500">{entry.date}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}