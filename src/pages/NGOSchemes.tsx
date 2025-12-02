import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SectionSpeaker } from "@/components/ui/section-speaker";
import { FarmIQNavbar } from "@/components/farmiq/FarmIQNavbar";
import { Search, Building2, Calendar, MapPin, ExternalLink, Phone, FileText, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getNgoSchemes, type NgoScheme as DBNgoScheme } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface NGOScheme {
  id: string;
  title: string;
  organization: string;
  description: string;
  eligibility: string[];
  benefits: string[];
  applicationDeadline: string;
  location: string;
  category: string;
  contactPhone: string;
  documentsRequired: string[];
  status: 'Active' | 'Upcoming' | 'Closed';
}

// Map DB schema to UI schema
function mapDBSchemeToUI(dbScheme: DBNgoScheme): NGOScheme {
  return {
    id: dbScheme.id.toString(),
    title: dbScheme.name || 'Untitled Scheme',
    organization: dbScheme.ministry || 'Government',
    description: dbScheme.benefit_text || 'No description available',
    eligibility: dbScheme.eligibility_text ? [dbScheme.eligibility_text] : [],
    benefits: dbScheme.benefit_text ? [dbScheme.benefit_text] : [],
    applicationDeadline: dbScheme.deadline || new Date().toISOString().split('T')[0],
    location: dbScheme.location || 'India',
    category: 'Government Scheme',
    contactPhone: dbScheme.contact_number || 'Not available',
    documentsRequired: Array(dbScheme.no_of_docs_required || 0).fill('Document required'),
    status: (dbScheme.status === 'active' ? 'Active' : dbScheme.status === 'upcoming' ? 'Upcoming' : 'Closed') as 'Active' | 'Upcoming' | 'Closed'
  };
}

const NGOSchemes = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [schemes, setSchemes] = useState<NGOScheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [language, setLanguage] = useState<'English' | 'Hindi' | 'Punjabi'>('English');

  useEffect(() => {
    fetchSchemes();
  }, []);

  const fetchSchemes = async () => {
    try {
      setLoading(true);
      const dbSchemes = await getNgoSchemes();
      const uiSchemes = dbSchemes.map(mapDBSchemeToUI);
      setSchemes(uiSchemes);
    } catch (error) {
      console.error('Error fetching NGO schemes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load NGO schemes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark');
  };

  const categories = ['all', 'Government Scheme'];
  const statuses = ['all', 'Active', 'Upcoming', 'Closed'];

  const filteredSchemes = schemes.filter(scheme => {
    const matchesSearch = scheme.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scheme.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scheme.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || scheme.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || scheme.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Upcoming': return 'warning';
      case 'Closed': return 'destructive';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <FarmIQNavbar
        theme={theme}
        language={language}
        onThemeToggle={toggleTheme}
        onLanguageChange={setLanguage}
      />

      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6 pt-24">
          <div className="flex items-center gap-4 mb-4">
          </div>
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">NGO Schemes & Government Programs</h1>
          </div>
          <p className="text-muted-foreground">
            Discover funding opportunities and support programs for farmers
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Search and Filters */}
        <div className="bg-card border rounded-lg p-6 mb-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search schemes, organizations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map(status => (
                  <SelectItem key={status} value={status}>
                    {status === 'all' ? 'All Status' : status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-muted-foreground">
            Found {filteredSchemes.length} schemes
          </p>
        </div>

        {/* Schemes Grid */}
        <div className="grid gap-6">
          {filteredSchemes.map((scheme) => {
            const getText = () => `${scheme.title}. ${scheme.description}. 
              Organization: ${scheme.organization}. 
              Location: ${scheme.location}. 
              Deadline: ${new Date(scheme.applicationDeadline).toLocaleDateString()}`;

            return (
              <Card key={scheme.id} className="overflow-hidden group">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle
                          className="text-xl"
                          data-tts="title"
                        >
                          {scheme.title}
                        </CardTitle>
                        <Badge variant={getStatusColor(scheme.status) as any}>
                          {scheme.status}
                        </Badge>
                        <SectionSpeaker
                          getText={getText}
                          sectionId={`ngo-scheme-${scheme.id}`}
                          ariaLabel={`Read ${scheme.title} scheme details`}
                          alwaysVisible
                        />
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        <span>{scheme.organization}</span>
                      </div>
                    </div>
                    <Badge variant="outline">{scheme.category}</Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div>
                    <CardDescription
                      className="mb-2"
                      data-tts="desc"
                    >
                      {scheme.description}
                    </CardDescription>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">
                        Eligibility
                      </h4>
                      <ul className="space-y-1">
                        {scheme.eligibility.map((item, index) => (
                          <li key={index} className="text-sm text-muted-foreground">
                            • {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">
                        Benefits
                      </h4>
                      <ul className="space-y-1">
                        {scheme.benefits.map((item, index) => (
                          <li key={index} className="text-sm text-muted-foreground">
                            • {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Deadline: {new Date(scheme.applicationDeadline).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{scheme.location}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{scheme.contactPhone}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>{scheme.documentsRequired.length} docs required</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button variant="default" className="gap-2">
                      <ExternalLink className="h-4 w-4" />
                      Apply Now
                    </Button>
                    <Button variant="outline">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredSchemes.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No schemes found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NGOSchemes;