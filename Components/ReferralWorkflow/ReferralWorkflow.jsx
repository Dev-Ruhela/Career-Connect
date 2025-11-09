import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Search,
  Send,
  Upload,
  Eye,
  CheckCircle,
  BarChart3,
  ArrowRight } from
"lucide-react";

const workflowSteps = [
{
  step: 1,
  title: "Browse Opportunities",
  description: "Student views alumni-posted jobs/internships",
  icon: Search,
  color: "from-blue-500 to-blue-600"
},
{
  step: 2,
  title: "Apply for Referral",
  description: "Student clicks Request Referral on a job card",
  icon: Send,
  color: "from-green-500 to-green-600"
},
{
  step: 3,
  title: "Provide Resume & Details",
  description: "Student uploads resume + writes a short note",
  icon: Upload,
  color: "from-purple-500 to-purple-600"
},
{
  step: 4,
  title: "Alumni Review",
  description: "Alumni gets notified, reviews student's request",
  icon: Eye,
  color: "from-orange-500 to-orange-600"
},
{
  step: 5,
  title: "Referral Shared",
  description: "Alumni approves and submits referral to company",
  icon: CheckCircle,
  color: "from-pink-500 to-pink-600"
},
{
  step: 6,
  title: "Status Tracking",
  description: "Student sees Pending, Approved, or Rejected in dashboard",
  icon: BarChart3,
  color: "from-indigo-500 to-indigo-600"
}];

export default function ReferralWorkflow() {
  return (
    <div className="mb-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
        How It Works - Step by Step Process
      </h2>
      
      {/* Desktop Timeline */}
      <div className="hidden lg:block">
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute top-16 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-green-500 via-purple-500 via-orange-500 via-pink-500 to-indigo-500 rounded-full"></div>
          
          <div className="grid grid-cols-6 gap-4">
            {workflowSteps.map((step, index) =>
            <div key={step.step} className="relative">
                <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
                  <CardContent className="text-center px-6 py-4 min-h-[180px]">
                    <div className={`w-12 h-12 mx-auto mb-3 bg-gradient-to-r ${step.color} rounded-full flex items-center justify-center shadow-lg relative z-10`}>
                      <step.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-sm font-bold text-gray-900 mb-2">
                      Step {step.step}
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-2 text-sm">
                      {step.title}
                    </h3>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-4">
        {workflowSteps.map((step, index) =>
        <div key={step.step}>
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 bg-gradient-to-r ${step.color} rounded-full flex items-center justify-center shadow-lg flex-shrink-0`}>
                    <step.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-blue-600 mb-1">
                      Step {step.step}
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {step.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {step.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            {index < workflowSteps.length - 1 &&
          <div className="flex justify-center py-2">
                <ArrowRight className="w-6 h-6 text-gray-400" />
              </div>
          }
          </div>
        )}
      </div>
    </div>);
}