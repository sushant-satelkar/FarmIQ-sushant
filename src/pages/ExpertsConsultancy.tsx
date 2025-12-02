import React, { useState } from "react";
import { FarmIQNavbar } from "@/components/farmiq/FarmIQNavbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Star, MessageCircle, Phone, Clock, Award, Users, Search, Filter, X, Send } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

// --- Mock Data ---
interface Expert {
    id: number;
    name: string;
    experience: string;
    expertise: string[];
    rating: number;
    consultations: number;
    bio: string;
    languages: string[];
    qualification: string;
}

const EXPERTS_DATA: Expert[] = [
    {
        id: 1,
        name: "Dr. Meera Joshi",
        experience: "12+ years",
        expertise: ["Crop Diseases", "Pest Management"],
        rating: 4.9,
        consultations: 1200,
        bio: "Senior Agronomist specializing in integrated pest management and sustainable crop protection strategies.",
        languages: ["English", "Hindi", "Marathi"],
        qualification: "Ph.D. in Plant Pathology"
    },
    {
        id: 2,
        name: "Rahul Deshmukh",
        experience: "8 years",
        expertise: ["Soil Health", "Organic Farming"],
        rating: 4.7,
        consultations: 900,
        bio: "Passionate organic farming consultant helping farmers transition to chemical-free agriculture.",
        languages: ["Hindi", "Marathi"],
        qualification: "M.Sc. in Soil Science"
    },
    {
        id: 3,
        name: "Dr. Kavita Sharma",
        experience: "15 years",
        expertise: ["Agri-Economics", "Market Trends"],
        rating: 4.8,
        consultations: 1500,
        bio: "Expert in agricultural economics, market analysis, and supply chain management.",
        languages: ["English", "Hindi", "Punjabi"],
        qualification: "Ph.D. in Agricultural Economics"
    },
    {
        id: 4,
        name: "Vikram Patil",
        experience: "6 years",
        expertise: ["Irrigation Systems", "Water Management"],
        rating: 4.6,
        consultations: 700,
        bio: "Irrigation engineer focused on efficient water usage and micro-irrigation systems.",
        languages: ["Hindi", "Kannada", "Marathi"],
        qualification: "B.Tech in Agricultural Engineering"
    },
    {
        id: 5,
        name: "Dr. Neha Kulkarni",
        experience: "10+ years",
        expertise: ["Plant Nutrition", "Fertilizers"],
        rating: 4.9,
        consultations: 1100,
        bio: "Specialist in plant nutrition management and customized fertilizer scheduling.",
        languages: ["English", "Hindi"],
        qualification: "Ph.D. in Agronomy"
    }
];

export default function ExpertsConsultancy() {
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [language, setLanguage] = useState<'English' | 'Hindi' | 'Punjabi'>('English');
    const [experts, setExperts] = useState<Expert[]>(EXPERTS_DATA);

    // Filters
    const [expertiseFilter, setExpertiseFilter] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");

    // Modals State
    const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isCallOpen, setIsCallOpen] = useState(false);
    const [chatMessage, setChatMessage] = useState("");
    const [chatHistory, setChatHistory] = useState<{ sender: 'user' | 'expert', text: string }[]>([]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
        document.documentElement.classList.toggle('dark');
    };

    // Filter Logic
    const filteredExperts = experts.filter(expert => {
        const matchesExpertise = expertiseFilter === "All" || expert.expertise.includes(expertiseFilter);
        const matchesSearch = expert.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            expert.expertise.some(e => e.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesExpertise && matchesSearch;
    });

    const allExpertise = Array.from(new Set(EXPERTS_DATA.flatMap(e => e.expertise)));

    // Handlers
    const openDetails = (expert: Expert) => {
        setSelectedExpert(expert);
        setIsDetailsOpen(true);
    };

    const openChat = (expert: Expert, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedExpert(expert);
        setChatHistory([{ sender: 'expert', text: `Namaste! I am ${expert.name}. How can I help you today?` }]);
        setIsChatOpen(true);
    };

    const openCall = (expert: Expert, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedExpert(expert);
        setIsCallOpen(true);
    };

    const handleSendMessage = () => {
        if (!chatMessage.trim()) return;
        setChatHistory([...chatHistory, { sender: 'user', text: chatMessage }]);
        setChatMessage("");

        // Mock reply
        setTimeout(() => {
            setChatHistory(prev => [...prev, { sender: 'expert', text: "Thank you for your query. Let me analyze that for you." }]);
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-background font-sans">
            <FarmIQNavbar
                theme={theme}
                language={language}
                onThemeToggle={toggleTheme}
                onLanguageChange={setLanguage}
            />

            <main className="pt-24 pb-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-foreground mb-2">Experts Consultancy</h1>
                    <p className="text-muted-foreground">Get personalized advice from top agricultural experts.</p>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search experts by name or expertise..."
                            className="pl-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Select value={expertiseFilter} onValueChange={setExpertiseFilter}>
                        <SelectTrigger className="w-full md:w-[200px]">
                            <SelectValue placeholder="Filter by Expertise" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All">All Expertise</SelectItem>
                            {allExpertise.map(exp => (
                                <SelectItem key={exp} value={exp}>{exp}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Experts Grid */}
                <div className="space-y-6">
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">Available Experts</h2>
                        <p className="text-sm text-muted-foreground">Choose the right specialist for your farming needs.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 gap-y-8">
                        {filteredExperts.map((expert) => (
                            <Card
                                key={expert.id}
                                className="group rounded-xl border-border/60 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer overflow-hidden bg-card"
                                onClick={() => openDetails(expert)}
                            >
                                <CardHeader className="pb-3 bg-gradient-to-b from-muted/30 to-transparent pt-5">
                                    <div className="flex justify-between items-start">
                                        <div className="flex gap-4">
                                            <div className="relative">
                                                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-primary font-bold text-xl border-2 border-background shadow-sm ring-1 ring-border/50">
                                                    {expert.name.charAt(0)}
                                                </div>
                                                <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5 shadow-sm">
                                                    <div className="bg-green-500 h-2.5 w-2.5 rounded-full border-2 border-background"></div>
                                                </div>
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg font-bold leading-tight">{expert.name}</CardTitle>
                                                <p className="text-xs text-muted-foreground font-medium mt-1">{expert.experience} Experience</p>
                                                {/* Optional Badge */}
                                                <div className="mt-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/5 text-[10px] font-medium text-primary/80">
                                                    <Award className="h-3 w-3" />
                                                    <span>Specialist</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 bg-gradient-to-r from-amber-50 to-yellow-50/50 text-amber-700 px-2.5 py-1 rounded-full text-xs font-semibold border border-amber-100/50 shadow-sm">
                                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                            {expert.rating}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-2 pb-5 px-5">
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {expert.expertise.map((exp, idx) => (
                                            <TooltipProvider key={idx}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Badge variant="secondary" className="bg-secondary/40 text-secondary-foreground hover:bg-secondary/60 transition-colors px-2.5 py-0.5 rounded-full text-[11px] font-medium border border-secondary/20 shadow-sm cursor-default">
                                                            {exp}
                                                        </Badge>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p className="text-xs">Expert in {exp}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        ))}
                                    </div>

                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-5 bg-muted/30 px-2.5 py-1.5 rounded-md w-fit transition-colors hover:bg-muted/50">
                                                    <Users className="h-3.5 w-3.5 opacity-70" />
                                                    <span className="font-medium">{expert.consultations}+ consultations</span>
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="text-xs">Total successful sessions</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>

                                    <div className="grid grid-cols-2 gap-3">
                                        <Button
                                            className="w-full bg-green-600 hover:bg-green-500 text-white gap-2 rounded-[14px] shadow-sm hover:shadow-md transition-all active:scale-95 duration-200 h-10"
                                            size="sm"
                                            onClick={(e) => openChat(expert, e)}
                                        >
                                            <MessageCircle className="h-4 w-4" />
                                            Chat
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-full gap-2 rounded-[14px] border-input hover:bg-accent hover:text-accent-foreground transition-all active:scale-95 duration-200 h-10"
                                            size="sm"
                                            onClick={(e) => openCall(expert, e)}
                                        >
                                            <Phone className="h-4 w-4" />
                                            Call
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Expert Details Modal */}
                <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Expert Profile</DialogTitle>
                        </DialogHeader>
                        {selectedExpert && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl">
                                        {selectedExpert.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">{selectedExpert.name}</h3>
                                        <p className="text-sm text-muted-foreground">{selectedExpert.qualification}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="outline" className="gap-1">
                                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                                {selectedExpert.rating}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">{selectedExpert.experience} Experience</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-semibold mb-2">About</h4>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {selectedExpert.bio}
                                    </p>
                                </div>

                                <div>
                                    <h4 className="text-sm font-semibold mb-2">Expertise</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedExpert.expertise.map((exp, idx) => (
                                            <Badge key={idx} variant="secondary">{exp}</Badge>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-semibold mb-2">Languages</h4>
                                    <p className="text-sm text-muted-foreground">{selectedExpert.languages.join(", ")}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                                        <p className="text-xs text-muted-foreground mb-1">Chat Consultation</p>
                                        <p className="font-bold text-primary">FREE</p>
                                    </div>
                                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                                        <p className="text-xs text-muted-foreground mb-1">Voice Call</p>
                                        <p className="font-bold text-primary">FREE</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Chat Modal */}
                <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
                    <DialogContent className="sm:max-w-[400px] h-[500px] flex flex-col p-0 gap-0 overflow-hidden">
                        <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm">
                                    {selectedExpert?.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-sm">{selectedExpert?.name}</h3>
                                    <p className="text-[10px] text-muted-foreground">
                                        Online
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {chatHistory.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${msg.sender === 'user'
                                        ? 'bg-primary text-primary-foreground rounded-tr-none'
                                        : 'bg-muted text-foreground rounded-tl-none'
                                        }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-3 border-t bg-background">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Type a message..."
                                    value={chatMessage}
                                    onChange={(e) => setChatMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    className="flex-1"
                                />
                                <Button size="icon" onClick={handleSendMessage}>
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Call Modal */}
                <Dialog open={isCallOpen} onOpenChange={setIsCallOpen}>
                    <DialogContent className="sm:max-w-[350px] text-center">
                        <DialogHeader>
                            <DialogTitle>Start Voice Call</DialogTitle>
                            <DialogDescription>
                                Consulting with {selectedExpert?.name}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="py-6 flex flex-col items-center justify-center">
                            <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mb-4 animate-pulse">
                                <Phone className="h-8 w-8 text-green-600" />
                            </div>
                            <p className="text-sm font-medium mb-1">Free Consultation</p>
                            <p className="text-xs text-muted-foreground">Connecting to secure line...</p>
                        </div>

                        <DialogFooter className="sm:justify-center gap-2">
                            <Button variant="destructive" onClick={() => setIsCallOpen(false)} className="w-full">
                                End Call
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

            </main>
        </div>
    );
}
