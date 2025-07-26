import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MapPin,
  Users,
  Trophy,
  Star,
  Search,
  Filter,
  Building2,
  GraduationCap,
  Shield,
  HelpCircle,
  Mail,
  Phone,
  Globe,
} from "lucide-react";
import ContextualHelp, { HelpContent } from "@/components/contextual-help";

export default function Organizations() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");

  const { data: organizations, isLoading } = useQuery({
    queryKey: ["/api/organizations"],
  });

  // Enhanced dummy data for African football organizations
  const dummyOrganizations = [
    // Top African Clubs
    {
      id: 1,
      name: "Al Ahly SC",
      type: "Professional Club",
      country: "Egypt",
      city: "Cairo",
      founded: 1907,
      playerCount: 28,
      reputation: 95,
      description:
        "Egypt's most successful club and CAF Champions League record holders",
      achievements: [
        "10x CAF Champions League",
        "36x Egyptian League",
        "37x Egypt Cup",
      ],
      verified: true,
      logo: "🦅",
    },
    {
      id: 2,
      name: "Mamelodi Sundowns",
      type: "Professional Club",
      country: "South Africa",
      city: "Pretoria",
      founded: 1970,
      playerCount: 32,
      reputation: 88,
      description: "South Africa's most successful club in recent years",
      achievements: [
        "1x CAF Champions League",
        "13x PSL Title",
        "2x CAF Super Cup",
      ],
      verified: true,
      logo: "☀️",
    },
    {
      id: 3,
      name: "Wydad Casablanca",
      type: "Professional Club",
      country: "Morocco",
      city: "Casablanca",
      founded: 1937,
      playerCount: 26,
      reputation: 85,
      description: "Morocco's most popular club with passionate fanbase",
      achievements: [
        "3x CAF Champions League",
        "22x Botola Pro",
        "9x Throne Cup",
      ],
      verified: true,
      logo: "🔴",
    },
    {
      id: 4,
      name: "TP Mazembe",
      type: "Professional Club",
      country: "DR Congo",
      city: "Lubumbashi",
      founded: 1939,
      playerCount: 24,
      reputation: 82,
      description: "Central Africa's most successful club internationally",
      achievements: [
        "5x CAF Champions League",
        "17x Linafoot",
        "1x FIFA Club World Cup Bronze",
      ],
      verified: true,
      logo: "⚫",
    },
    {
      id: 5,
      name: "Esperance Tunis",
      type: "Professional Club",
      country: "Tunisia",
      city: "Tunis",
      founded: 1919,
      playerCount: 29,
      reputation: 84,
      description: "Tunisia's most successful club and CAF powerhouse",
      achievements: [
        "4x CAF Champions League",
        "31x Tunisian League",
        "15x Tunisia Cup",
      ],
      verified: true,
      logo: "🔴",
    },
    // Academies
    {
      id: 6,
      name: "Right to Dream Academy",
      type: "Youth Academy",
      country: "Ghana",
      city: "Akosombo",
      founded: 1999,
      playerCount: 84,
      reputation: 90,
      description:
        "Elite football and education academy producing Premier League talent",
      achievements: [
        "50+ players to European clubs",
        "Partnership with FC Nordsjælland",
      ],
      verified: true,
      logo: "⭐",
    },
    {
      id: 7,
      name: "ASEC Mimosas Academy",
      type: "Youth Academy",
      country: "Ivory Coast",
      city: "Abidjan",
      founded: 1948,
      playerCount: 120,
      reputation: 87,
      description:
        "Legendary academy that produced Yaya Touré, Kolo Touré, and Salomon Kalou",
      achievements: [
        "100+ professional players",
        "Multiple Ballon d'Or winners developed",
      ],
      verified: true,
      logo: "🟡",
    },
    {
      id: 8,
      name: "JMG Academy Bamako",
      type: "Youth Academy",
      country: "Mali",
      city: "Bamako",
      founded: 2002,
      playerCount: 78,
      reputation: 83,
      description:
        "Part of global JMG network focusing on technical development",
      achievements: [
        "Partnership with European clubs",
        "Ligue 1 player development",
      ],
      verified: true,
      logo: "🎯",
    },
    // Federations
    {
      id: 9,
      name: "Confederation of African Football",
      type: "Federation",
      country: "Multi-National",
      city: "Cairo",
      founded: 1957,
      playerCount: 0,
      reputation: 100,
      description:
        "Governing body of African football, organizing AFCON and continental competitions",
      achievements: [
        "54 member associations",
        "AFCON since 1957",
        "CAF Champions League",
      ],
      verified: true,
      logo: "🏆",
    },
    {
      id: 10,
      name: "Ghana Football Association",
      type: "Federation",
      country: "Ghana",
      city: "Accra",
      founded: 1957,
      playerCount: 5000,
      reputation: 88,
      description: "Governing body of Ghana football, managing the Black Stars",
      achievements: [
        "4x AFCON Winner",
        "4x World Cup Appearances",
        "Olympic Bronze 1992",
        "FIFA U-20 World Cup 2001",
      ],
      verified: true,
      logo: "🇬🇭",
    },
    {
      id: 11,
      name: "Nigeria Football Association",
      type: "Federation",
      country: "Nigeria",
      city: "Abuja",
      founded: 1960,
      playerCount: 8000,
      reputation: 85,
      description:
        "Governing body of Nigeria football, managing the Super Eagles",
      achievements: [
        "3x AFCON Winner",
        "5x World Cup Appearances",
        "Olympic Gold 1996",
        "FIFA U-20 World Cup 2012",
      ],
      verified: true,
      logo: "🦅",
    },
    // Agents & Management
    {
      id: 12,
      name: "Stellar Group Africa",
      type: "Management Agency",
      country: "South Africa",
      city: "Johannesburg",
      founded: 2010,
      playerCount: 45,
      reputation: 79,
      description:
        "Leading African player management and representation agency",
      achievements: [
        "€50M+ in transfers facilitated",
        "Premier League player network",
      ],
      verified: true,
      logo: "⭐",
    },
    {
      id: 13,
      name: "Prosport International",
      type: "Management Agency",
      country: "Morocco",
      city: "Casablanca",
      founded: 2005,
      playerCount: 32,
      reputation: 75,
      description:
        "Specialized in North African talent development and European transfers",
      achievements: ["La Liga partnerships", "Ligue 1 player placements"],
      verified: false,
      logo: "🎯",
    },
    {
      id: 14,
      name: "Ark Sports Management Agency",
      type: "Management Agency",
      country: "Ghana/United Kingdom",
      city: "Accra/London",
      founded: 2024,
      playerCount: 25,
      reputation: 82,
      description:
        "FA and FIFA Licensed agency specialising in talent development and career management with presence in Ghana and UK",
      achievements: [
        "FA Licensed Agent",
        "FIFA Licensed Agency",
        "Ghana-UK player transfers",
        "Talent showcase events",
      ],
      verified: true,
      logo: "🏆",
    },
  ];

  const filteredOrgs = dummyOrganizations.filter((org) => {
    const matchesSearch =
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType =
      typeFilter === "all" ||
      org.type.toLowerCase().includes(typeFilter.toLowerCase());
    const matchesCountry =
      countryFilter === "all" || org.country === countryFilter;
    return matchesSearch && matchesType && matchesCountry;
  });

  const getTypeIcon = (type: string) => {
    if (type.includes("Club")) return Building2;
    if (type.includes("Academy")) return GraduationCap;
    if (type.includes("Federation")) return Shield;
    return Users;
  };

  const getReputationColor = (reputation: number) => {
    if (reputation >= 90) return "bg-green-500";
    if (reputation >= 80) return "bg-blue-500";
    if (reputation >= 70) return "bg-yellow-500";
    return "bg-gray-500";
  };

  const organizationsByType = {
    clubs: filteredOrgs.filter((org) => org.type.includes("Club")),
    academies: filteredOrgs.filter((org) => org.type.includes("Academy")),
    federations: filteredOrgs.filter((org) => org.type.includes("Federation")),
    agencies: filteredOrgs.filter((org) => org.type.includes("Agency")),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Organizations
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            African football clubs, academies, federations, and agencies
          </p>
        </div>
        <Badge variant="outline" className="w-fit">
          {filteredOrgs.length} organizations
        </Badge>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search organizations, countries, or cities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Organization Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="club">Professional Clubs</SelectItem>
            <SelectItem value="academy">Youth Academies</SelectItem>
            <SelectItem value="federation">Federations</SelectItem>
            <SelectItem value="agency">Management Agencies</SelectItem>
          </SelectContent>
        </Select>
        <Select value={countryFilter} onValueChange={setCountryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Countries</SelectItem>
            <SelectItem value="Egypt">Egypt</SelectItem>
            <SelectItem value="South Africa">South Africa</SelectItem>
            <SelectItem value="Morocco">Morocco</SelectItem>
            <SelectItem value="Nigeria">Nigeria</SelectItem>
            <SelectItem value="Ghana">Ghana</SelectItem>
            <SelectItem value="Ivory Coast">Ivory Coast</SelectItem>
            <SelectItem value="Tunisia">Tunisia</SelectItem>
            <SelectItem value="DR Congo">DR Congo</SelectItem>
            <SelectItem value="Mali">Mali</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Organization Tabs */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All ({filteredOrgs.length})</TabsTrigger>
          <TabsTrigger value="clubs">
            Clubs ({organizationsByType.clubs.length})
          </TabsTrigger>
          <TabsTrigger value="academies">
            Academies ({organizationsByType.academies.length})
          </TabsTrigger>
          <TabsTrigger value="federations">
            Federations ({organizationsByType.federations.length})
          </TabsTrigger>
          <TabsTrigger value="agencies">
            Agencies ({organizationsByType.agencies.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrgs.map((org) => {
              const IconComponent = getTypeIcon(org.type);
              return (
                <Card
                  key={org.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{org.logo}</div>
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {org.name}
                            {org.verified && (
                              <Star
                                className="h-4 w-4 text-yellow-500"
                                fill="currentColor"
                              />
                            )}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-1">
                            <IconComponent className="h-3 w-3" />
                            {org.type}
                          </CardDescription>
                        </div>
                      </div>
                      <div
                        className={`w-3 h-3 rounded-full ${getReputationColor(org.reputation)}`}
                        title={`Reputation: ${org.reputation}/100`}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {org.description}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {org.city}, {org.country}
                      </span>
                      <span>Est. {org.founded}</span>
                      {org.playerCount > 0 && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {org.playerCount} players
                        </span>
                      )}
                    </div>

                    {org.achievements.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                          <Trophy className="h-3 w-3" />
                          Key Achievements
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {org.achievements
                            .slice(0, 2)
                            .map((achievement, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="text-xs"
                              >
                                {achievement}
                              </Badge>
                            ))}
                          {org.achievements.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{org.achievements.length - 2} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        View Details
                      </Button>
                      <Button variant="outline" size="sm">
                        Contact
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Individual type tabs with same content structure */}
        {Object.entries(organizationsByType).map(([type, orgs]) => (
          <TabsContent key={type} value={type} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {orgs.map((org) => {
                const IconComponent = getTypeIcon(org.type);
                return (
                  <Card
                    key={org.id}
                    className="hover:shadow-lg transition-shadow"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{org.logo}</div>
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              {org.name}
                              {org.verified && (
                                <Star
                                  className="h-4 w-4 text-yellow-500"
                                  fill="currentColor"
                                />
                              )}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-1">
                              <IconComponent className="h-3 w-3" />
                              {org.type}
                            </CardDescription>
                          </div>
                        </div>
                        <div
                          className={`w-3 h-3 rounded-full ${getReputationColor(org.reputation)}`}
                          title={`Reputation: ${org.reputation}/100`}
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {org.description}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {org.city}, {org.country}
                        </span>
                        <span>Est. {org.founded}</span>
                        {org.playerCount > 0 && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {org.playerCount} players
                          </span>
                        )}
                      </div>

                      {org.achievements.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                            <Trophy className="h-3 w-3" />
                            Key Achievements
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {org.achievements
                              .slice(0, 2)
                              .map((achievement, index) => (
                                <Badge
                                  key={index}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {achievement}
                                </Badge>
                              ))}
                            {org.achievements.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{org.achievements.length - 2} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          View Details
                        </Button>
                        <Button variant="outline" size="sm">
                          Contact
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
