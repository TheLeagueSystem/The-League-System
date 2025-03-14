import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Trophy, Award } from 'lucide-react';

interface SpeakerScore {
  user_id: number;
  username: string;
  role: string;
  score: number;
  comments: string;
}

interface RoundResultData {
  winning_side: 'GOVERNMENT' | 'OPPOSITION';
  summary: string;
  submitted_by: {
    id: number;
    username: string;
  };
  submitted_at: string;
  speaker_scores: SpeakerScore[];
}

interface RoundResultsProps {
  roundId: string;
}

const RoundResults: React.FC<RoundResultsProps> = ({ roundId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [results, setResults] = useState<RoundResultData | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        
        const response = await fetch(`http://127.0.0.1:8000/api/round/${roundId}/results/`, {
          headers: {
            "Authorization": `Token ${token}`
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            setError("Results have not been submitted for this round yet");
          } else {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to fetch round results");
          }
          return;
        }

        const data = await response.json();
        setResults(data);
        setError("");
      } catch (err: any) {
        setError(err.message || "An error occurred while fetching results");
        console.error("Error fetching round results:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [roundId]);

  // Get top speaker
  const topSpeaker = results?.speaker_scores.reduce((prev, current) => 
    (prev.score > current.score) ? prev : current
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg border border-amber-300 bg-amber-50 text-amber-800">
        {error}
      </div>
    );
  }

  if (!results) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-t-lg">
          <CardTitle className="flex items-center">
            <Trophy size={24} className="mr-2" />
            Round Results
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex justify-center items-center mb-6">
            <div className={`text-center p-4 rounded-lg ${
              results.winning_side === 'GOVERNMENT' 
                ? 'bg-blue-100 border border-blue-300 text-blue-800' 
                : 'bg-red-100 border border-red-300 text-red-800'
            }`}>
              <h3 className="text-xl font-bold mb-1">
                {results.winning_side === 'GOVERNMENT' ? 'Government' : 'Opposition'} Victory
              </h3>
              <p className="text-sm">
                Winning side determined by Chair Adjudicator
              </p>
            </div>
          </div>
          
          {topSpeaker && (
            <div className="mb-6 text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="flex items-center justify-center text-lg font-bold mb-2 text-yellow-800">
                <Award size={20} className="mr-2 text-yellow-600" />
                Top Speaker
              </h3>
              <p className="font-medium">{topSpeaker.username}</p>
              <p className="text-sm text-gray-600">{topSpeaker.role}</p>
              <p className="text-lg font-bold mt-1">{topSpeaker.score.toFixed(1)} points</p>
            </div>
          )}
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Chair Adjudicator's Summary</h3>
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="whitespace-pre-wrap">{results.summary}</p>
              <p className="text-sm text-gray-500 mt-4">
                Submitted by {results.submitted_by.username} on {new Date(results.submitted_at).toLocaleString()}
              </p>
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Speaker Scores</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left p-2">Speaker</th>
                    <th className="text-left p-2">Role</th>
                    <th className="text-left p-2">Score</th>
                    <th className="text-left p-2">Feedback</th>
                  </tr>
                </thead>
                <tbody>
                  {results.speaker_scores
                    .sort((a, b) => b.score - a.score)
                    .map(score => (
                      <tr key={score.user_id} className="border-t">
                        <td className="p-2 font-medium">{score.username}</td>
                        <td className={`p-2 ${
                          ['Prime Minister', 'Deputy Prime Minister', 'Member of Government', 'Government Whip'].includes(score.role)
                            ? 'text-blue-600'
                            : 'text-red-600'
                        }`}>
                          {score.role}
                        </td>
                        <td className="p-2 font-bold">{score.score.toFixed(1)}</td>
                        <td className="p-2 text-sm text-gray-600">{score.comments}</td>
                      </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoundResults;