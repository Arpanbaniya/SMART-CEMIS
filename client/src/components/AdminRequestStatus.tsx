import { useQuery } from "@tanstack/react-query";
import { Shield, CheckCircle } from "lucide-react";
import { AdminRequest } from "@shared/schema";

export function AdminRequestStatus() {
  const { data: requests = [] } = useQuery<AdminRequest[]>({
    queryKey: ["/api/admin", "my-requests"],
    queryFn: async () => {
      const response = await fetch("/api/admin/my-requests", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch admin requests");
      }
      return response.json();
    },
  });

  const activeRequests = requests.filter(r => r.status === 'approved' && !r.usedForEventCreation);
  const canSubmitNewRequest = activeRequests.length === 0;

  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-4 text-center">
        <Shield className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm text-gray-600">No admin requests submitted</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Request Status Indicator */}
      {canSubmitNewRequest && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <h4 className="font-semibold text-green-800">You can submit a new request</h4>
              <p className="text-sm text-green-600">Submit a request to create another event</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
