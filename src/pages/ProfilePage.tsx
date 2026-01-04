import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, X, Link2, ExternalLink, Save } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const ProfilePage = () => {
  const { user } = useAuth();
  const { profile, isLoading, updateProfile } = useProfile();
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    headline: '',
    bio: '',
    institution: '',
    department: '',
    location: '',
    degree_status: '',
    account_type: '',
    avatar_url: '',
    research_fields: [] as string[],
    methods: [] as string[],
    tools: [] as string[],
  });
  const [newTag, setNewTag] = useState('');
  const [tagType, setTagType] = useState<'research_fields' | 'methods' | 'tools'>('research_fields');
  const [linkedProfiles, setLinkedProfiles] = useState<
    Array<{ platform: string; url: string; username?: string }>
  >([]);
  const [newLinkedProfile, setNewLinkedProfile] = useState({ platform: '', url: '', username: '' });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        headline: profile.headline || '',
        bio: profile.bio || '',
        institution: profile.institution || '',
        department: profile.department || '',
        location: profile.location || '',
        degree_status: (profile as any).degree_status || '',
        account_type: profile.account_type || 'student',
        avatar_url: profile.avatar_url || '',
        research_fields: profile.research_fields || [],
        methods: profile.methods || [],
        tools: profile.tools || [],
      });
      loadLinkedProfiles();
    }
  }, [profile]);

  const loadLinkedProfiles = async () => {
    if (!user?.id) return;
    try {
      const { data } = await supabase
        .from('linked_profiles')
        .select('*')
        .eq('user_id', user.id);
      if (data) {
        setLinkedProfiles(data.map((lp) => ({ platform: lp.platform, url: lp.url, username: lp.username || '' })));
      }
    } catch (error) {
      console.error('Failed to load linked profiles:', error);
    }
  };

  const handleSave = async () => {
    try {
      await updateProfile({
        ...formData,
        updated_at: new Date().toISOString(),
      });
      setEditMode(false);
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error('Failed to update profile');
    }
  };

  const handleAddTag = () => {
    if (!newTag.trim()) return;
    setFormData((prev) => ({
      ...prev,
      [tagType]: [...prev[tagType], newTag.trim()],
    }));
    setNewTag('');
  };

  const handleRemoveTag = (type: 'research_fields' | 'methods' | 'tools', index: number) => {
    setFormData((prev) => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index),
    }));
  };

  const handleAddLinkedProfile = async () => {
    if (!newLinkedProfile.platform || !newLinkedProfile.url || !user?.id) return;
    try {
      const { error } = await supabase.from('linked_profiles').insert({
        user_id: user.id,
        platform: newLinkedProfile.platform,
        url: newLinkedProfile.url,
        username: newLinkedProfile.username || null,
      });
      if (error) throw error;
      await loadLinkedProfiles();
      setNewLinkedProfile({ platform: '', url: '', username: '' });
      toast.success('Linked profile added');
    } catch (error: any) {
      toast.error('Failed to add linked profile');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="animate-pulse">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold">Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your academic profile and research interests</p>
        </div>
        {!editMode ? (
          <Button onClick={() => setEditMode(true)}>Edit Profile</Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditMode(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList>
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="research">Research</TabsTrigger>
          <TabsTrigger value="links">Linked Profiles</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Your personal and institutional details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile?.avatar_url || ''} />
                  <AvatarFallback className="text-2xl">
                    {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                {editMode && (
                  <div>
                    <Label>Avatar URL</Label>
                    <Input
                      placeholder="https://..."
                      value={formData.avatar_url}
                      onChange={(e) => setFormData((prev) => ({ ...prev, avatar_url: e.target.value }))}
                    />
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Full Name</Label>
                  {editMode ? (
                    <Input
                      value={formData.full_name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, full_name: e.target.value }))}
                    />
                  ) : (
                    <p className="text-sm py-2">{profile?.full_name || 'Not set'}</p>
                  )}
                </div>

                <div>
                  <Label>Account Type</Label>
                  {editMode ? (
                    <Select
                      value={formData.account_type}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, account_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="professor">Professor</SelectItem>
                        <SelectItem value="lab">Lab</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm py-2 capitalize">{profile?.account_type || 'Not set'}</p>
                  )}
                </div>

                <div>
                  <Label>Degree Status</Label>
                  {editMode ? (
                    <Select
                      value={formData.degree_status}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, degree_status: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select degree status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="undergraduate">Undergraduate</SelectItem>
                        <SelectItem value="masters">Masters</SelectItem>
                        <SelectItem value="phd">PhD</SelectItem>
                        <SelectItem value="postdoc">Postdoc</SelectItem>
                        <SelectItem value="professor">Professor</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm py-2 capitalize">{formData.degree_status || 'Not set'}</p>
                  )}
                </div>

                <div>
                  <Label>Institution</Label>
                  {editMode ? (
                    <Input
                      value={formData.institution}
                      onChange={(e) => setFormData((prev) => ({ ...prev, institution: e.target.value }))}
                      placeholder="University name"
                    />
                  ) : (
                    <p className="text-sm py-2">{profile?.institution || 'Not set'}</p>
                  )}
                </div>

                <div>
                  <Label>Department</Label>
                  {editMode ? (
                    <Input
                      value={formData.department}
                      onChange={(e) => setFormData((prev) => ({ ...prev, department: e.target.value }))}
                      placeholder="Department name"
                    />
                  ) : (
                    <p className="text-sm py-2">{profile?.department || 'Not set'}</p>
                  )}
                </div>

                <div>
                  <Label>Location</Label>
                  {editMode ? (
                    <Input
                      value={formData.location}
                      onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                      placeholder="City, Country"
                    />
                  ) : (
                    <p className="text-sm py-2">{profile?.location || 'Not set'}</p>
                  )}
                </div>
              </div>

              <div>
                <Label>Headline</Label>
                {editMode ? (
                  <Input
                    value={formData.headline}
                    onChange={(e) => setFormData((prev) => ({ ...prev, headline: e.target.value }))}
                    placeholder="Brief professional headline"
                  />
                ) : (
                  <p className="text-sm py-2">{profile?.headline || 'Not set'}</p>
                )}
              </div>

              <div>
                <Label>Bio</Label>
                {editMode ? (
                  <Textarea
                    value={formData.bio}
                    onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                    rows={5}
                    placeholder="Tell us about yourself..."
                  />
                ) : (
                  <p className="text-sm py-2 whitespace-pre-wrap">{profile?.bio || 'No bio provided'}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="research" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Research Interests & Skills</CardTitle>
              <CardDescription>Add tags for research fields, methods, and tools</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {(['research_fields', 'methods', 'tools'] as const).map((type) => (
                <div key={type}>
                  <Label className="text-base capitalize mb-2 block">
                    {type.replace('_', ' ')} ({formData[type].length})
                  </Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData[type].map((tag, index) => (
                      <Badge key={index} variant="secondary" className="gap-1">
                        {tag}
                        {editMode && (
                          <X
                            className="w-3 h-3 cursor-pointer"
                            onClick={() => handleRemoveTag(type, index)}
                          />
                        )}
                      </Badge>
                    ))}
                  </div>
                  {editMode && (
                    <div className="flex gap-2">
                      <Input
                        placeholder={`Add ${type.replace('_', ' ')}`}
                        value={tagType === type ? newTag : ''}
                        onChange={(e) => {
                          setTagType(type);
                          setNewTag(e.target.value);
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          setTagType(type);
                          handleAddTag();
                        }}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="links" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Linked Profiles</CardTitle>
              <CardDescription>Connect your Google Scholar, ORCID, GitHub, and other profiles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {linkedProfiles.map((lp, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Link2 className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium capitalize">{lp.platform.replace('_', ' ')}</span>
                      {lp.username && <span className="text-sm text-muted-foreground">({lp.username})</span>}
                      <a
                        href={lp.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        View <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              {editMode && (
                <div className="border-t pt-4 space-y-3">
                  <div className="grid md:grid-cols-3 gap-2">
                    <Select
                      value={newLinkedProfile.platform}
                      onValueChange={(value) =>
                        setNewLinkedProfile((prev) => ({ ...prev, platform: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Platform" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="google_scholar">Google Scholar</SelectItem>
                        <SelectItem value="orcid">ORCID</SelectItem>
                        <SelectItem value="github">GitHub</SelectItem>
                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                        <SelectItem value="semantic_scholar">Semantic Scholar</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="URL"
                      value={newLinkedProfile.url}
                      onChange={(e) => setNewLinkedProfile((prev) => ({ ...prev, url: e.target.value }))}
                    />
                    <div className="flex gap-2">
                      <Input
                        placeholder="Username (optional)"
                        value={newLinkedProfile.username}
                        onChange={(e) =>
                          setNewLinkedProfile((prev) => ({ ...prev, username: e.target.value }))
                        }
                      />
                      <Button onClick={handleAddLinkedProfile} size="sm">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfilePage;

