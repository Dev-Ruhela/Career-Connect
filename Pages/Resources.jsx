import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { CareerResource } from "@/entities/CareerResource";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BookOpen, 
  Search, 
  Filter,
  FileText,
  ExternalLink,
  Video,
  Download,
  Heart,
  PlusCircle,
  TrendingUp,
  Users,
  Award,
  Code
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ResourcesPage() {
  const [resources, setResources] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [likedResources, setLikedResources] = useState([]);

  const [newResource, setNewResource] = useState({
    title: "",
    description: "",
    category: "Resume Templates",
    type: "Document",
    content_url: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [user, resourceList] = await Promise.all([
        User.me(),
        CareerResource.list('-created_date')
      ]);
      setCurrentUser(user);
      setResources(resourceList.filter(r => r.is_approved));
    } catch (error) {
      console.error("Error loading resources:", error);
    }
    setIsLoading(false);
  };

  const handleUploadResource = async () => {
    if (!newResource.title.trim() || !newResource.content_url.trim()) return;

    try {
      await CareerResource.create({
        ...newResource,
        uploaded_by: currentUser.id,
        is_approved: true // Auto-approve for now
      });
      
      setShowUploadDialog(false);
      setNewResource({
        title: "",
        description: "",
        category: "Resume Templates", 
        type: "Document",
        content_url: ""
      });
      loadData();
    } catch (error) {
      console.error("Error uploading resource:", error);
    }
  };
  
  const handleLike = async (resourceId) => {
    if (likedResources.includes(resourceId)) return; // Already liked in this session

    const originalResources = [...resources];
    const resourceToUpdate = resources.find(r => r.id === resourceId);
    if (!resourceToUpdate) return;

    const currentLikes = resourceToUpdate.likes_count || 0;

    // Optimistically update UI
    setLikedResources(prev => [...prev, resourceId]);
    setResources(prevResources => prevResources.map(r => 
        r.id === resourceId ? { ...r, likes_count: currentLikes + 1 } : r
    ));

    try {
        await CareerResource.update(resourceId, { likes_count: currentLikes + 1 });
    } catch (error) {
        console.error("Error liking resource:", error);
        // Revert optimistic update on error
        setResources(originalResources);
        setLikedResources(prev => prev.filter(id => id !== resourceId));
    }
  };

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || resource.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getResourcesByCategory = (category) => {
    return resources.filter(r => r.category === category);
  };

  const getResourceIcon = (type) => {
    switch (type) {
      case "Document": return FileText;
      case "Video": return Video;
      case "Link": return ExternalLink;
      default: return BookOpen;
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      "Resume Templates": "bg-blue-100 text-blue-800",
      "Interview Prep": "bg-green-100 text-green-800", 
      "DSA Practice": "bg-purple-100 text-purple-800",
      "System Design": "bg-orange-100 text-orange-800",
      "HR Tips": "bg-pink-100 text-pink-800",
      "Coding Practice": "bg-indigo-100 text-indigo-800",
      "Career Guidance": "bg-yellow-100 text-yellow-800",
      "Other": "bg-gray-100 text-gray-800"
    };
    return colors[category] || colors["Other"];
  };

  if (isLoading) {
    return (
      <div className="p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  const ResourceCard = ({ resource }) => {
    const ResourceIcon = getResourceIcon(resource.type);
    const isLiked = likedResources.includes(resource.id);

    return (
      <Card key={resource.id} className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm group flex flex-col">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <ResourceIcon className="w-5 h-5 text-blue-600" />
                <Badge variant="secondary" className={getCategoryColor(resource.category)}>
                  {resource.category}
                </Badge>
              </div>
              <CardTitle className="text-lg font-bold text-gray-900 line-clamp-2">
                {resource.title}
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4 flex flex-col flex-grow">
          <p className="text-sm text-gray-600 line-clamp-3 flex-grow">
            {resource.description}
          </p>
          
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <Button
              variant="ghost"
              size="sm"
              className={`flex items-center gap-1.5 transition-colors ${
                isLiked 
                ? 'text-red-500 cursor-default' 
                : 'text-gray-500 hover:text-red-500'
              }`}
              onClick={() => handleLike(resource.id)}
              disabled={isLiked}
            >
              <Heart className={`w-4 h-4 transition-all ${isLiked ? 'fill-current' : ''}`} />
              <span className="font-medium">{resource.likes_count || 0}</span>
            </Button>
            <Button size="sm" asChild>
              <a href={resource.content_url} target="_blank" rel="noopener noreferrer">
                {resource.type === "Document" ? <Download className="w-4 h-4 mr-1" /> : <ExternalLink className="w-4 h-4 mr-1" />}
                {resource.type === "Document" ? "Download" : "View"}
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  const ResourceList = ({ resources }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {resources.map(resource => <ResourceCard key={resource.id} resource={resource} />)}
    </div>
  );

  return (
    <div className="p-6 md:p-8 bg-gradient-to-br from-blue-50 via-white to-indigo-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Career Resources 📚
            </h1>
            <p className="text-gray-600 text-lg">
              Curated resources to boost your career and interview prep
            </p>
          </div>
          <Button onClick={() => setShowUploadDialog(true)}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Share Resource
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-4 text-center">
              <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-80" />
              <div className="text-2xl font-bold">{resources.length}</div>
              <p className="text-xs opacity-80">Total Resources</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-80" />
              <div className="text-2xl font-bold">{getResourcesByCategory("Interview Prep").length}</div>
              <p className="text-xs opacity-80">Interview Prep</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-4 text-center">
              <Code className="w-8 h-8 mx-auto mb-2 opacity-80" />
              <div className="text-2xl font-bold">{getResourcesByCategory("DSA Practice").length}</div>
              <p className="text-xs opacity-80">DSA Practice</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0">
            <CardContent className="p-4 text-center">
              <Award className="w-8 h-8 mx-auto mb-2 opacity-80" />
              <div className="text-2xl font-bold">{getResourcesByCategory("Resume Templates").length}</div>
              <p className="text-xs opacity-80">Resume Templates</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search resources..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Resume Templates">Resume Templates</SelectItem>
                  <SelectItem value="Interview Prep">Interview Prep</SelectItem>
                  <SelectItem value="DSA Practice">DSA Practice</SelectItem>
                  <SelectItem value="System Design">System Design</SelectItem>
                  <SelectItem value="HR Tips">HR Tips</SelectItem>
                  <SelectItem value="Coding Practice">Coding Practice</SelectItem>
                  <SelectItem value="Career Guidance">Career Guidance</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                Advanced Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Resources by Category */}
        <Tabs defaultValue="all" className="mb-8">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
            <TabsTrigger value="all">All Resources</TabsTrigger>
            <TabsTrigger value="interview">Interview Prep</TabsTrigger>
            <TabsTrigger value="resume">Resume & CV</TabsTrigger>
            <TabsTrigger value="coding">Coding Practice</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <ResourceList resources={filteredResources} />
          </TabsContent>

          <TabsContent value="interview">
             <ResourceList resources={filteredResources.filter(r => r.category === "Interview Prep" || r.category === "HR Tips")} />
          </TabsContent>

          <TabsContent value="resume">
            <ResourceList resources={filteredResources.filter(r => r.category === "Resume Templates")} />
          </TabsContent>

          <TabsContent value="coding">
            <ResourceList resources={filteredResources.filter(r => r.category === "DSA Practice" || r.category === "Coding Practice")} />
          </TabsContent>
        </Tabs>

        {filteredResources.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No resources found</h3>
            <p className="text-gray-500">Try adjusting your search or share the first resource!</p>
          </div>
        )}

        {/* Upload Resource Dialog */}
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Share a Career Resource</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Resource Title</label>
                <Input
                  placeholder="e.g. Software Engineer Resume Template"
                  value={newResource.title}
                  onChange={(e) => setNewResource(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <Select value={newResource.category} onValueChange={(value) => setNewResource(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Resume Templates">Resume Templates</SelectItem>
                    <SelectItem value="Interview Prep">Interview Prep</SelectItem>
                    <SelectItem value="DSA Practice">DSA Practice</SelectItem>
                    <SelectItem value="System Design">System Design</SelectItem>
                    <SelectItem value="HR Tips">HR Tips</SelectItem>
                    <SelectItem value="Coding Practice">Coding Practice</SelectItem>
                    <SelectItem value="Career Guidance">Career Guidance</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Resource Type</label>
                <Select value={newResource.type} onValueChange={(value) => setNewResource(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Document">Document</SelectItem>
                    <SelectItem value="Link">Link</SelectItem>
                    <SelectItem value="Video">Video</SelectItem>
                    <SelectItem value="Guide">Guide</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Resource URL</label>
                <Input
                  placeholder="https://..."
                  value={newResource.content_url}
                  onChange={(e) => setNewResource(prev => ({ ...prev, content_url: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <Textarea
                  placeholder="Brief description of this resource..."
                  value={newResource.description}
                  onChange={(e) => setNewResource(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowUploadDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  className="flex-1"
                  onClick={handleUploadResource}
                  disabled={!newResource.title.trim() || !newResource.content_url.trim()}
                >
                  Share Resource
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}