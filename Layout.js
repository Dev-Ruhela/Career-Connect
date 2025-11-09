import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/entities/User";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  BookOpen,
  MessageCircle,
  Globe,
  Menu,
  X,
  GraduationCap,
  Link2,
  Settings,
  UserPlus,
  Shield,
  LogOut
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Role-based navigation items
const getNavigationItems = (userRole) => {
  const navigationMap = {
    user: [
      {
        title: "Dashboard",
        url: createPageUrl("Dashboard"),
        icon: LayoutDashboard
      },
      {
        title: "Find Mentors",
        url: createPageUrl("Mentors"),
        icon: Users
      },
      {
        title: "Job Referrals",
        url: createPageUrl("Referrals"),
        icon: Briefcase
      },
      {
        title: "Career Resources",
        url: createPageUrl("Resources"),
        icon: BookOpen
      },
      {
        title: "Community",
        url: createPageUrl("Community"),
        icon: Globe
      },
      {
        title: "My Connections",
        url: createPageUrl("MyConnections"),
        icon: Link2
      },
      {
        title: "AI Assistant",
        url: createPageUrl("AIChat"),
        icon: MessageCircle
      }
    ],
    mentor: [
      {
        title: "Dashboard",
        url: createPageUrl("Dashboard"),
        icon: LayoutDashboard
      },
      {
        title: "My Mentees",
        url: createPageUrl("MentorDashboard"),
        icon: Users
      },
      {
        title: "Referral Requests",
        url: createPageUrl("MentorReferrals"),
        icon: Briefcase
      },
      {
        title: "My Connections",
        url: createPageUrl("MyConnections"),
        icon: Link2
      }
    ],
    admin: [
      {
        title: "Dashboard",
        url: createPageUrl("Dashboard"),
        icon: LayoutDashboard
      },
      {
        title: "Manage Communities",
        url: createPageUrl("AdminCommunities"),
        icon: Globe
      },
      {
        title: "Manage Mentors",
        url: createPageUrl("AdminMentors"),
        icon: UserPlus
      },
      {
        title: "Post Opportunities",
        url: createPageUrl("AdminOpportunities"),
        icon: Briefcase
      }
    ]
  };

  return navigationMap[userRole] || [];
};

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
    } catch (error) {
      console.log("User not authenticated");
    }
    setIsLoading(false);
  };

  const getUserRole = (user) => {
    // Explicit role assignment
    if (user?.role === 'admin') return 'admin';
    
    // Mentor: Alumni or users with expertise domains
    if (user?.year === 'Alumni' || (user?.expertise_domains && user.expertise_domains.length > 0)) {
      return 'mentor';
    }
    
    // Default: regular user/student
    return 'user';
  };

  const getRoleDisplay = (role) => {
    switch (role) {
      case 'admin': 
        return { text: 'Administrator', color: 'bg-purple-100 text-purple-800', icon: Shield };
      case 'mentor': 
        return { text: 'Mentor', color: 'bg-green-100 text-green-800', icon: Users };
      default: 
        return { text: 'Student', color: 'bg-blue-100 text-blue-800', icon: GraduationCap };
    }
  };

  const handleLogout = async () => {
    try {
      await User.logout();
      window.location.reload(); // Refresh the page to reset state
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If user is not authenticated, show login page
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Career Connect</h1>
            <p className="text-gray-600 mb-2">IIITA Student Portal</p>
            <p className="text-sm text-gray-500 mb-8">Connect with mentors, find opportunities, and advance your career</p>
            
            <Button
              onClick={() => User.login()}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-3 rounded-xl text-lg font-medium hover:shadow-lg transition-all duration-200"
            >
              Sign In with IIITA Account
            </Button>
            
            <p className="text-xs text-gray-400 mt-6">
              Secure login through your institutional email
            </p>
          </div>
        </div>
      </div>
    );
  }

  const userRole = getUserRole(currentUser);
  const navigationItems = getNavigationItems(userRole);
  const roleDisplay = getRoleDisplay(userRole);
  const RoleIcon = roleDisplay.icon;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <Sidebar className="border-r border-blue-100 bg-white/80 backdrop-blur-sm">
          <SidebarHeader className="border-b border-blue-100 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-lg">Career Connect</h2>
                <p className="text-xs text-blue-600 font-medium">IIITA Platform</p>
              </div>
            </div>
            
            {/* User Role Badge */}
            <div className="mt-4 flex items-center justify-between">
              <Badge className={`${roleDisplay.color} flex items-center gap-1`}>
                <RoleIcon className="w-3 h-3" />
                {roleDisplay.text}
              </Badge>
              {currentUser.year && (
                <Badge variant="outline" className="text-xs">
                  {currentUser.year}
                </Badge>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="p-3">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">
                {userRole === 'admin' ? 'Admin Panel' : userRole === 'mentor' ? 'Mentor Dashboard' : 'Student Portal'}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        className={`transition-all duration-200 rounded-xl px-3 py-2.5 ${
                          (location.pathname === item.url || (item.title === 'Community' && currentPageName === 'Community'))
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg'
                            : 'hover:bg-blue-50 hover:text-blue-700'
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3">
                          <item.icon className="w-5 h-5" />
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Role-specific stats */}
            <SidebarGroup className="mt-6">
              <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">
                Quick Stats
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="px-3 py-3 space-y-3">
                  {userRole === 'user' && (
                    <>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Available Mentors</span>
                        <span className="font-semibold text-blue-600">24</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Job Referrals</span>
                        <span className="font-semibold text-green-600">89</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Career Resources</span>
                        <span className="font-semibold text-purple-600">156</span>
                      </div>
                    </>
                  )}
                  
                  {userRole === 'mentor' && (
                    <>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Mentorship Requests</span>
                        <span className="font-semibold text-yellow-600">3</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Active Mentees</span>
                        <span className="font-semibold text-green-600">12</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Referral Requests</span>
                        <span className="font-semibold text-blue-600">7</span>
                      </div>
                    </>
                  )}
                  
                  {userRole === 'admin' && (
                    <>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Total Users</span>
                        <span className="font-semibold text-blue-600">1,247</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Communities</span>
                        <span className="font-semibold text-green-600">12</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Active Opportunities</span>
                        <span className="font-semibold text-purple-600">45</span>
                      </div>
                    </>
                  )}
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-blue-100 p-4">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="w-10 h-10 ring-2 ring-blue-200">
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold">
                  {currentUser.full_name?.slice(0, 2).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">
                  {currentUser.full_name || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
              </div>
            </div>
            
            <Button 
              onClick={handleLogout}
              variant="outline" 
              className="w-full text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className="bg-white/80 backdrop-blur-sm border-b border-blue-100 px-6 py-4 md:hidden">
            <div className="flex items-center justify-between">
              <SidebarTrigger className="hover:bg-blue-50 p-2 rounded-lg transition-colors duration-200" />
              <div className="flex items-center gap-2">
                <GraduationCap className="w-6 h-6 text-blue-600" />
                <h1 className="text-lg font-bold text-gray-900">Career Connect</h1>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}