import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Minus, MessageSquare } from 'lucide-react';

interface SentimentData {
  positive: number;
  neutral: number;
  negative: number;
  total: number;
  averageRating: number;
  flaggedCount?: number;
}

interface SentimentAnalysisProps {
  eventId: string;
  data: SentimentData;
}

export function SentimentAnalysis({ eventId, data }: SentimentAnalysisProps) {
  const { positive, neutral, negative, total, averageRating, flaggedCount } = data;

  // Calculate percentages
  const positivePercent = total > 0 ? Math.round((positive / total) * 100) : 0;
  const neutralPercent = total > 0 ? Math.round((neutral / total) * 100) : 0;
  const negativePercent = total > 0 ? Math.round((negative / total) * 100) : 0;

  // Chart data
  const barChartData = [
    { name: 'Positive', value: positive, fill: '#22c55e' },
    { name: 'Neutral', value: neutral, fill: '#6b7280' },
    { name: 'Negative', value: negative, fill: '#ef4444' }
  ];

  const pieChartData = [
    { name: 'Positive', value: positivePercent, fill: '#22c55e' },
    { name: 'Neutral', value: neutralPercent, fill: '#6b7280' },
    { name: 'Negative', value: negativePercent, fill: '#ef4444' }
  ];

  const getSentimentIcon = () => {
    if (averageRating >= 4) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (averageRating >= 3) return <Minus className="h-4 w-4 text-gray-500" />;
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  const getSentimentColor = () => {
    if (averageRating >= 4) return 'text-green-600';
    if (averageRating >= 3) return 'text-gray-600';
    return 'text-red-600';
  };

  const getSentimentLabel = () => {
    if (averageRating >= 4) return 'Positive';
    if (averageRating >= 3) return 'Neutral';
    return 'Needs Attention';
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Reviews</p>
                <p className="text-2xl font-bold">{total}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Rating</p>
                <p className={`text-2xl font-bold ${getSentimentColor()}`}>
                  {averageRating.toFixed(1)}
                </p>
              </div>
              {getSentimentIcon()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sentiment</p>
                <p className={`text-lg font-bold ${getSentimentColor()}`}>
                  {getSentimentLabel()}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {flaggedCount !== undefined && flaggedCount > 0 && (
          <Card className="border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">Flagged</p>
                  <p className="text-2xl font-bold text-red-600">{flaggedCount}</p>
                </div>
                <Badge variant="destructive">Alert</Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sentiment Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sentiment Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Percentage Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detailed Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm font-medium">Positive</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{positive} reviews</span>
                <Badge variant="secondary" className="text-green-600">
                  {positivePercent}%
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                <span className="text-sm font-medium">Neutral</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{neutral} reviews</span>
                <Badge variant="secondary" className="text-gray-600">
                  {neutralPercent}%
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-sm font-medium">Negative</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{negative} reviews</span>
                <Badge variant="secondary" className="text-red-600">
                  {negativePercent}%
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
