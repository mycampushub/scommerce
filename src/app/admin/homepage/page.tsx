'use client'

import React, { useState, useEffect } from 'react'
import { 
  Plus, Pencil, Trash2, GripVertical, Eye, EyeOff, 
  Save, RefreshCw, Image as ImageIcon, Video, ExternalLink,
  ChevronUp, ChevronDown, Settings
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { ImageUpload } from '@/components/admin/image-upload'

// Types
interface Banner {
  id: string
  title: string
  description?: string
  image: string
  mobileImage?: string
  buttonText?: string
  buttonLink?: string
  isActive: boolean
  order: number
}

interface Story {
  id: string
  title: string
  thumbnail: string
  images: string[]
  isActive: boolean
  order: number
}

interface Reel {
  id: string
  title: string
  thumbnail: string
  videoUrl: string
  productIds: string[]
  isActive: boolean
  order: number
}

interface Promotion {
  id: string
  title: string
  description?: string
  image: string
  ctaText?: string
  ctaLink?: string
  isActive: boolean
  order: number
}

interface HomepageSetting {
  sectionName: string
  isEnabled: boolean
  autoPlay: number | null
  displayLimit: number | null
}

interface Product {
  id: string
  name: string
  price: number
}

export default function HomepageManagementPage() {
  // State
  const [activeTab, setActiveTab] = useState('banners')
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>([])

  // Banners state
  const [banners, setBanners] = useState<Banner[]>([])
  const [bannerDialogOpen, setBannerDialogOpen] = useState(false)
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null)
  const [bannerForm, setBannerForm] = useState({
    title: '',
    description: '',
    image: '',
    mobileImage: '',
    buttonText: '',
    buttonLink: ''
  })

  // Stories state
  const [stories, setStories] = useState<Story[]>([])
  const [storyDialogOpen, setStoryDialogOpen] = useState(false)
  const [editingStory, setEditingStory] = useState<Story | null>(null)
  const [storyForm, setStoryForm] = useState({
    title: '',
    thumbnail: '',
    images: [] as string[]
  })

  // Reels state
  const [reels, setReels] = useState<Reel[]>([])
  const [reelDialogOpen, setReelDialogOpen] = useState(false)
  const [editingReel, setEditingReel] = useState<Reel | null>(null)
  const [reelForm, setReelForm] = useState({
    title: '',
    thumbnail: '',
    videoUrl: '',
    productIds: [] as string[]
  })

  // Promotions state
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [promotionDialogOpen, setPromotionDialogOpen] = useState(false)
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null)
  const [promotionForm, setPromotionForm] = useState({
    title: '',
    description: '',
    image: '',
    ctaText: '',
    ctaLink: ''
  })

  // Settings state
  const [settings, setSettings] = useState<Record<string, HomepageSetting>>({})
  const [savingSettings, setSavingSettings] = useState(false)

  // Fetch functions
  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products?limit=100')
      const data = await res.json()
      if (data.success) {
        setProducts(data.data)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const fetchBanners = async () => {
    try {
      const res = await fetch('/api/admin/banners')
      const data = await res.json()
      if (data.success) {
        setBanners(data.data)
      }
    } catch (error) {
      console.error('Error fetching banners:', error)
      toast.error('Failed to fetch banners')
    }
  }

  const fetchStories = async () => {
    try {
      const res = await fetch('/api/admin/stories')
      const data = await res.json()
      if (data.success) {
        setStories(data.data)
      }
    } catch (error) {
      console.error('Error fetching stories:', error)
      toast.error('Failed to fetch stories')
    }
  }

  const fetchReels = async () => {
    try {
      const res = await fetch('/api/admin/reels')
      const data = await res.json()
      if (data.success) {
        setReels(data.data)
      }
    } catch (error) {
      console.error('Error fetching reels:', error)
      toast.error('Failed to fetch reels')
    }
  }

  const fetchPromotions = async () => {
    try {
      const res = await fetch('/api/admin/promotions')
      const data = await res.json()
      if (data.success) {
        setPromotions(data.data)
      }
    } catch (error) {
      console.error('Error fetching promotions:', error)
      toast.error('Failed to fetch promotions')
    }
  }

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/homepage/settings')
      const data = await res.json()
      if (data.success) {
        const settingsObj: Record<string, HomepageSetting> = {}
        data.data.forEach((setting: HomepageSetting) => {
          settingsObj[setting.sectionName] = setting
        })
        setSettings(settingsObj)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast.error('Failed to fetch settings')
    }
  }

  useEffect(() => {
    fetchBanners()
    fetchStories()
    fetchReels()
    fetchPromotions()
    fetchSettings()
    fetchProducts()
  }, [])

  // Banner handlers
  const handleSaveBanner = async () => {
    try {
      const url = editingBanner ? `/api/admin/banners/${editingBanner.id}` : '/api/admin/banners'
      const method = editingBanner ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bannerForm)
      })

      const data = await res.json()
      if (data.success) {
        toast.success(editingBanner ? 'Banner updated' : 'Banner created')
        setBannerDialogOpen(false)
        setEditingBanner(null)
        setBannerForm({ title: '', description: '', image: '', mobileImage: '', buttonText: '', buttonLink: '' })
        fetchBanners()
      } else {
        toast.error(data.error || 'Failed to save banner')
      }
    } catch (error) {
      console.error('Error saving banner:', error)
      toast.error('Failed to save banner')
    }
  }

  const handleDeleteBanner = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return

    try {
      const res = await fetch(`/api/admin/banners/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Banner deleted')
        fetchBanners()
      } else {
        toast.error(data.error || 'Failed to delete banner')
      }
    } catch (error) {
      console.error('Error deleting banner:', error)
      toast.error('Failed to delete banner')
    }
  }

  const handleToggleBannerActive = async (banner: Banner) => {
    try {
      const res = await fetch(`/api/admin/banners/${banner.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !banner.isActive })
      })
      const data = await res.json()
      if (data.success) {
        toast.success(banner.isActive ? 'Banner disabled' : 'Banner enabled')
        fetchBanners()
      }
    } catch (error) {
      console.error('Error toggling banner:', error)
      toast.error('Failed to toggle banner')
    }
  }

  // Story handlers
  const handleSaveStory = async () => {
    try {
      const url = editingStory ? `/api/admin/stories/${editingStory.id}` : '/api/admin/stories'
      const method = editingStory ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(storyForm)
      })

      const data = await res.json()
      if (data.success) {
        toast.success(editingStory ? 'Story updated' : 'Story created')
        setStoryDialogOpen(false)
        setEditingStory(null)
        setStoryForm({ title: '', thumbnail: '', images: [] })
        fetchStories()
      } else {
        toast.error(data.error || 'Failed to save story')
      }
    } catch (error) {
      console.error('Error saving story:', error)
      toast.error('Failed to save story')
    }
  }

  const handleDeleteStory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this story?')) return

    try {
      const res = await fetch(`/api/admin/stories/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Story deleted')
        fetchStories()
      } else {
        toast.error(data.error || 'Failed to delete story')
      }
    } catch (error) {
      console.error('Error deleting story:', error)
      toast.error('Failed to delete story')
    }
  }

  const handleToggleStoryActive = async (story: Story) => {
    try {
      const res = await fetch(`/api/admin/stories/${story.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !story.isActive })
      })
      const data = await res.json()
      if (data.success) {
        toast.success(story.isActive ? 'Story disabled' : 'Story enabled')
        fetchStories()
      }
    } catch (error) {
      console.error('Error toggling story:', error)
      toast.error('Failed to toggle story')
    }
  }

  // Reel handlers
  const handleSaveReel = async () => {
    try {
      const url = editingReel ? `/api/admin/reels/${editingReel.id}` : '/api/admin/reels'
      const method = editingReel ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reelForm)
      })

      const data = await res.json()
      if (data.success) {
        toast.success(editingReel ? 'Reel updated' : 'Reel created')
        setReelDialogOpen(false)
        setEditingReel(null)
        setReelForm({ title: '', thumbnail: '', videoUrl: '', productIds: [] })
        fetchReels()
      } else {
        toast.error(data.error || 'Failed to save reel')
      }
    } catch (error) {
      console.error('Error saving reel:', error)
      toast.error('Failed to save reel')
    }
  }

  const handleDeleteReel = async (id: string) => {
    if (!confirm('Are you sure you want to delete this reel?')) return

    try {
      const res = await fetch(`/api/admin/reels/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Reel deleted')
        fetchReels()
      } else {
        toast.error(data.error || 'Failed to delete reel')
      }
    } catch (error) {
      console.error('Error deleting reel:', error)
      toast.error('Failed to delete reel')
    }
  }

  const handleToggleReelActive = async (reel: Reel) => {
    try {
      const res = await fetch(`/api/admin/reels/${reel.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !reel.isActive })
      })
      const data = await res.json()
      if (data.success) {
        toast.success(reel.isActive ? 'Reel disabled' : 'Reel enabled')
        fetchReels()
      }
    } catch (error) {
      console.error('Error toggling reel:', error)
      toast.error('Failed to toggle reel')
    }
  }

  // Promotion handlers
  const handleSavePromotion = async () => {
    try {
      const url = editingPromotion ? `/api/admin/promotions/${editingPromotion.id}` : '/api/admin/promotions'
      const method = editingPromotion ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promotionForm)
      })

      const data = await res.json()
      if (data.success) {
        toast.success(editingPromotion ? 'Promotion updated' : 'Promotion created')
        setPromotionDialogOpen(false)
        setEditingPromotion(null)
        setPromotionForm({ title: '', description: '', image: '', ctaText: '', ctaLink: '' })
        fetchPromotions()
      } else {
        toast.error(data.error || 'Failed to save promotion')
      }
    } catch (error) {
      console.error('Error saving promotion:', error)
      toast.error('Failed to save promotion')
    }
  }

  const handleDeletePromotion = async (id: string) => {
    if (!confirm('Are you sure you want to delete this promotion?')) return

    try {
      const res = await fetch(`/api/admin/promotions/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Promotion deleted')
        fetchPromotions()
      } else {
        toast.error(data.error || 'Failed to delete promotion')
      }
    } catch (error) {
      console.error('Error deleting promotion:', error)
      toast.error('Failed to delete promotion')
    }
  }

  const handleTogglePromotionActive = async (promotion: Promotion) => {
    try {
      const res = await fetch(`/api/admin/promotions/${promotion.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !promotion.isActive })
      })
      const data = await res.json()
      if (data.success) {
        toast.success(promotion.isActive ? 'Promotion disabled' : 'Promotion enabled')
        fetchPromotions()
      }
    } catch (error) {
      console.error('Error toggling promotion:', error)
      toast.error('Failed to toggle promotion')
    }
  }

  // Settings handlers
  const handleSaveSettings = async () => {
    setSavingSettings(true)
    try {
      const res = await fetch('/api/admin/homepage/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: Object.values(settings) })
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Settings saved successfully')
      } else {
        toast.error(data.error || 'Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setSavingSettings(false)
    }
  }

  // Reorder handlers (simplified version)
  const handleMoveItem = async (type: 'banner' | 'story' | 'reel' | 'promotion', id: string, direction: 'up' | 'down') => {
    const items = type === 'banner' ? banners : type === 'story' ? stories : type === 'reel' ? reels : promotions
    const setItems = type === 'banner' ? setBanners : type === 'story' ? setStories : type === 'reel' ? setReels : setPromotions
    const apiPath = `/api/admin/${type}s/${id}/reorder`

    const index = items.findIndex(item => item.id === id)
    if (index === -1) return

    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= items.length) return

    const newItems = [...items]
    const temp = newItems[index].order
    newItems[index].order = newItems[newIndex].order
    newItems[newIndex].order = temp
    newItems.sort((a, b) => a.order - b.order)

    setItems(newItems)

    try {
      await fetch(apiPath, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: newItems[index].order })
      })
    } catch (error) {
      console.error('Error reordering:', error)
      toast.error('Failed to reorder item')
      fetchBanners()
      fetchStories()
      fetchReels()
      fetchPromotions()
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Homepage Management</h1>
        <p className="text-gray-600">Manage all homepage content including banners, stories, reels, and promotions</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="banners">Banners</TabsTrigger>
          <TabsTrigger value="stories">Stories</TabsTrigger>
          <TabsTrigger value="reels">Reels</TabsTrigger>
          <TabsTrigger value="promotions">Promotions</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Banners Tab */}
        <TabsContent value="banners" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Banners</h2>
            <Dialog open={bannerDialogOpen} onOpenChange={setBannerDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingBanner(null)
                  setBannerForm({ title: '', description: '', image: '', mobileImage: '', buttonText: '', buttonLink: '' })
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Banner
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingBanner ? 'Edit Banner' : 'Add Banner'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={bannerForm.title}
                      onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                      placeholder="Banner title"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={bannerForm.description}
                      onChange={(e) => setBannerForm({ ...bannerForm, description: e.target.value })}
                      placeholder="Banner description"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label>Desktop Image</Label>
                    <ImageUpload
                      value={bannerForm.image}
                      onChange={(url) => setBannerForm({ ...bannerForm, image: url })}
                      aspectRatio="landscape"
                    />
                  </div>
                  <div>
                    <Label>Mobile Image (Optional)</Label>
                    <ImageUpload
                      value={bannerForm.mobileImage}
                      onChange={(url) => setBannerForm({ ...bannerForm, mobileImage: url })}
                      aspectRatio="portrait"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Button Text</Label>
                      <Input
                        value={bannerForm.buttonText}
                        onChange={(e) => setBannerForm({ ...bannerForm, buttonText: e.target.value })}
                        placeholder="Shop Now"
                      />
                    </div>
                    <div>
                      <Label>Button Link</Label>
                      <Input
                        value={bannerForm.buttonLink}
                        onChange={(e) => setBannerForm({ ...bannerForm, buttonLink: e.target.value })}
                        placeholder="/shop"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleSaveBanner} disabled={!bannerForm.title || !bannerForm.image}>
                    {editingBanner ? 'Update' : 'Create'} Banner
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {banners.map((banner, index) => (
              <Card key={banner.id} className={banner.isActive ? '' : 'opacity-50'}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMoveItem('banner', banner.id, 'up')}
                        disabled={index === 0}
                      >
                        <ChevronUp className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMoveItem('banner', banner.id, 'down')}
                        disabled={index === banners.length - 1}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="w-24 h-16 rounded bg-gray-200 overflow-hidden flex-shrink-0">
                      {banner.image && (
                        <img src={banner.image} alt={banner.title} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{banner.title}</h3>
                      {banner.description && (
                        <p className="text-sm text-gray-600 truncate">{banner.description}</p>
                      )}
                      {banner.buttonText && (
                        <p className="text-sm text-pink-600">{banner.buttonText} →</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={banner.isActive}
                        onCheckedChange={() => handleToggleBannerActive(banner)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingBanner(banner)
                          setBannerForm({
                            title: banner.title,
                            description: banner.description || '',
                            image: banner.image,
                            mobileImage: banner.mobileImage || '',
                            buttonText: banner.buttonText || '',
                            buttonLink: banner.buttonLink || ''
                          })
                          setBannerDialogOpen(true)
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteBanner(banner.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {banners.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No banners found. Click "Add Banner" to create one.
              </div>
            )}
          </div>
        </TabsContent>

        {/* Stories Tab */}
        <TabsContent value="stories" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Stories</h2>
            <Dialog open={storyDialogOpen} onOpenChange={setStoryDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingStory(null)
                  setStoryForm({ title: '', thumbnail: '', images: [] })
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Story
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingStory ? 'Edit Story' : 'Add Story'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={storyForm.title}
                      onChange={(e) => setStoryForm({ ...storyForm, title: e.target.value })}
                      placeholder="Story title"
                    />
                  </div>
                  <div>
                    <Label>Thumbnail</Label>
                    <ImageUpload
                      value={storyForm.thumbnail}
                      onChange={(url) => setStoryForm({ ...storyForm, thumbnail: url })}
                      aspectRatio="square"
                    />
                  </div>
                  <div>
                    <Label>Images (Multiple)</Label>
                    <ImageUpload
                      value={storyForm.images[0] || ''}
                      onChange={(url) => setStoryForm({ ...storyForm, images: [url, ...storyForm.images.slice(1)] })}
                      aspectRatio="portrait"
                      multiple
                    />
                    {storyForm.images.length > 0 && (
                      <div className="mt-2 flex gap-2 flex-wrap">
                        {storyForm.images.map((img, idx) => (
                          <div key={idx} className="w-16 h-16 rounded bg-gray-200 overflow-hidden relative">
                            <img src={img} alt={`Image ${idx + 1}`} className="w-full h-full object-cover" />
                            <Button
                              variant="destructive"
                              size="sm"
                              className="absolute top-1 right-1 w-6 h-6 p-0"
                              onClick={() => setStoryForm({
                                ...storyForm,
                                images: storyForm.images.filter((_, i) => i !== idx)
                              })}
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleSaveStory} disabled={!storyForm.title || !storyForm.thumbnail || storyForm.images.length === 0}>
                    {editingStory ? 'Update' : 'Create'} Story
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {stories.map((story, index) => (
              <Card key={story.id} className={story.isActive ? '' : 'opacity-50'}>
                <CardContent className="p-3">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMoveItem('story', story.id, 'up')}
                        disabled={index === 0}
                      >
                        <ChevronUp className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMoveItem('story', story.id, 'down')}
                        disabled={index === stories.length - 1}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="aspect-square rounded-full overflow-hidden bg-gray-200 border-2 border-pink-500">
                      {story.thumbnail && (
                        <img src={story.thumbnail} alt={story.title} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <h3 className="font-medium text-sm text-center truncate">{story.title}</h3>
                    <div className="flex items-center justify-between gap-1">
                      <Switch
                        checked={story.isActive}
                        onCheckedChange={() => handleToggleStoryActive(story)}
                        size="sm"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingStory(story)
                          setStoryForm({
                            title: story.title,
                            thumbnail: story.thumbnail,
                            images: story.images
                          })
                          setStoryDialogOpen(true)
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteStory(story.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {stories.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500">
                No stories found. Click "Add Story" to create one.
              </div>
            )}
          </div>
        </TabsContent>

        {/* Reels Tab */}
        <TabsContent value="reels" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Video Reels</h2>
            <Dialog open={reelDialogOpen} onOpenChange={setReelDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingReel(null)
                  setReelForm({ title: '', thumbnail: '', videoUrl: '', productIds: [] })
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Reel
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingReel ? 'Edit Reel' : 'Add Reel'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={reelForm.title}
                      onChange={(e) => setReelForm({ ...reelForm, title: e.target.value })}
                      placeholder="Reel title"
                    />
                  </div>
                  <div>
                    <Label>Thumbnail</Label>
                    <ImageUpload
                      value={reelForm.thumbnail}
                      onChange={(url) => setReelForm({ ...reelForm, thumbnail: url })}
                      aspectRatio="portrait"
                    />
                  </div>
                  <div>
                    <Label>Video URL (YouTube or Vimeo)</Label>
                    <Input
                      value={reelForm.videoUrl}
                      onChange={(e) => setReelForm({ ...reelForm, videoUrl: e.target.value })}
                      placeholder="https://www.youtube.com/embed/VIDEO_ID"
                    />
                  </div>
                  <div>
                    <Label>Associated Products</Label>
                    <select
                      multiple
                      className="w-full border rounded-md p-2 min-h-[100px]"
                      value={reelForm.productIds}
                      onChange={(e) => {
                        const selectedOptions = Array.from(e.target.selectedOptions)
                        const selectedIds = selectedOptions.map(opt => opt.value)
                        setReelForm({ ...reelForm, productIds: selectedIds })
                      }}
                    >
                      {products.map(product => (
                        <option key={product.id} value={product.id}>
                          {product.name} - ৳{product.price}
                        </option>
                      ))}
                    </select>
                    <p className="text-sm text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple products</p>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleSaveReel} disabled={!reelForm.title || !reelForm.thumbnail || !reelForm.videoUrl}>
                    {editingReel ? 'Update' : 'Create'} Reel
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {reels.map((reel, index) => (
              <Card key={reel.id} className={reel.isActive ? '' : 'opacity-50'}>
                <CardContent className="p-3">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMoveItem('reel', reel.id, 'up')}
                        disabled={index === 0}
                      >
                        <ChevronUp className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMoveItem('reel', reel.id, 'down')}
                        disabled={index === reels.length - 1}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="aspect-[9/16] rounded-lg overflow-hidden bg-gray-200 relative">
                      {reel.thumbnail && (
                        <img src={reel.thumbnail} alt={reel.title} className="w-full h-full object-cover" />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 bg-white/80 rounded-full flex items-center justify-center">
                          <Video className="w-6 h-6" />
                        </div>
                      </div>
                    </div>
                    <h3 className="font-medium text-sm text-center truncate">{reel.title}</h3>
                    <div className="flex items-center justify-between gap-1">
                      <Switch
                        checked={reel.isActive}
                        onCheckedChange={() => handleToggleReelActive(reel)}
                        size="sm"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingReel(reel)
                          setReelForm({
                            title: reel.title,
                            thumbnail: reel.thumbnail,
                            videoUrl: reel.videoUrl,
                            productIds: reel.productIds
                          })
                          setReelDialogOpen(true)
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteReel(reel.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {reels.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500">
                No reels found. Click "Add Reel" to create one.
              </div>
            )}
          </div>
        </TabsContent>

        {/* Promotions Tab */}
        <TabsContent value="promotions" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Promotions</h2>
            <Dialog open={promotionDialogOpen} onOpenChange={setPromotionDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingPromotion(null)
                  setPromotionForm({ title: '', description: '', image: '', ctaText: '', ctaLink: '' })
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Promotion
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingPromotion ? 'Edit Promotion' : 'Add Promotion'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={promotionForm.title}
                      onChange={(e) => setPromotionForm({ ...promotionForm, title: e.target.value })}
                      placeholder="Promotion title"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={promotionForm.description}
                      onChange={(e) => setPromotionForm({ ...promotionForm, description: e.target.value })}
                      placeholder="Promotion description"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label>Image</Label>
                    <ImageUpload
                      value={promotionForm.image}
                      onChange={(url) => setPromotionForm({ ...promotionForm, image: url })}
                      aspectRatio="landscape"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>CTA Text</Label>
                      <Input
                        value={promotionForm.ctaText}
                        onChange={(e) => setPromotionForm({ ...promotionForm, ctaText: e.target.value })}
                        placeholder="Shop Now"
                      />
                    </div>
                    <div>
                      <Label>CTA Link</Label>
                      <Input
                        value={promotionForm.ctaLink}
                        onChange={(e) => setPromotionForm({ ...promotionForm, ctaLink: e.target.value })}
                        placeholder="/shop"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleSavePromotion} disabled={!promotionForm.title || !promotionForm.image}>
                    {editingPromotion ? 'Update' : 'Create'} Promotion
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {promotions.map((promotion, index) => (
              <Card key={promotion.id} className={promotion.isActive ? '' : 'opacity-50'}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveItem('promotion', promotion.id, 'up')}
                          disabled={index === 0}
                        >
                          <ChevronUp className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveItem('promotion', promotion.id, 'down')}
                          disabled={index === promotions.length - 1}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                      </div>
                      <Switch
                        checked={promotion.isActive}
                        onCheckedChange={() => handleTogglePromotionActive(promotion)}
                      />
                    </div>
                    <div className="aspect-video rounded-lg overflow-hidden bg-gray-200">
                      {promotion.image && (
                        <img src={promotion.image} alt={promotion.title} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">{promotion.title}</h3>
                      {promotion.description && (
                        <p className="text-sm text-gray-600">{promotion.description}</p>
                      )}
                      {promotion.ctaText && (
                        <p className="text-sm text-pink-600 font-medium">{promotion.ctaText} →</p>
                      )}
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingPromotion(promotion)
                          setPromotionForm({
                            title: promotion.title,
                            description: promotion.description || '',
                            image: promotion.image,
                            ctaText: promotion.ctaText || '',
                            ctaLink: promotion.ctaLink || ''
                          })
                          setPromotionDialogOpen(true)
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePromotion(promotion.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {promotions.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500">
                No promotions found. Click "Add Promotion" to create one.
              </div>
            )}
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Homepage Settings</h2>
            <Button onClick={handleSaveSettings} disabled={savingSettings}>
              {savingSettings ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>

          <div className="grid gap-6">
            {/* Banners Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Banners Section
                </CardTitle>
                <CardDescription>Configure banner carousel settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Banners</Label>
                  <Switch
                    checked={settings.banners?.isEnabled || false}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({
                        ...prev,
                        banners: { ...prev.banners!, sectionName: 'banners', isEnabled: checked }
                      }))
                    }
                  />
                </div>
                <div>
                  <Label>Auto-play Interval (ms)</Label>
                  <Input
                    type="number"
                    value={settings.banners?.autoPlay || 5000}
                    onChange={(e) =>
                      setSettings(prev => ({
                        ...prev,
                        banners: { ...prev.banners!, sectionName: 'banners', autoPlay: parseInt(e.target.value) || 5000 }
                      }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Stories Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Stories Section
                </CardTitle>
                <CardDescription>Configure Instagram-style stories</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Stories</Label>
                  <Switch
                    checked={settings.stories?.isEnabled || false}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({
                        ...prev,
                        stories: { ...prev.stories!, sectionName: 'stories', isEnabled: checked }
                      }))
                    }
                  />
                </div>
                <div>
                  <Label>Auto-play Interval (ms)</Label>
                  <Input
                    type="number"
                    value={settings.stories?.autoPlay || 4000}
                    onChange={(e) =>
                      setSettings(prev => ({
                        ...prev,
                        stories: { ...prev.stories!, sectionName: 'stories', autoPlay: parseInt(e.target.value) || 4000 }
                      }))
                    }
                  />
                </div>
                <div>
                  <Label>Display Limit</Label>
                  <Input
                    type="number"
                    value={settings.stories?.displayLimit || 10}
                    onChange={(e) =>
                      setSettings(prev => ({
                        ...prev,
                        stories: { ...prev.stories!, sectionName: 'stories', displayLimit: parseInt(e.target.value) || 10 }
                      }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Reels Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="w-5 h-5" />
                  Reels Section
                </CardTitle>
                <CardDescription>Configure video reels/shorts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Reels</Label>
                  <Switch
                    checked={settings.reels?.isEnabled || false}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({
                        ...prev,
                        reels: { ...prev.reels!, sectionName: 'reels', isEnabled: checked }
                      }))
                    }
                  />
                </div>
                <div>
                  <Label>Display Limit</Label>
                  <Input
                    type="number"
                    value={settings.reels?.displayLimit || 10}
                    onChange={(e) =>
                      setSettings(prev => ({
                        ...prev,
                        reels: { ...prev.reels!, sectionName: 'reels', displayLimit: parseInt(e.target.value) || 10 }
                      }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Promotions Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="w-5 h-5" />
                  Promotions Section
                </CardTitle>
                <CardDescription>Configure promotional banners</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Promotions</Label>
                  <Switch
                    checked={settings.promotions?.isEnabled || false}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({
                        ...prev,
                        promotions: { ...prev.promotions!, sectionName: 'promotions', isEnabled: checked }
                      }))
                    }
                  />
                </div>
                <div>
                  <Label>Display Limit</Label>
                  <Input
                    type="number"
                    value={settings.promotions?.displayLimit || 4}
                    onChange={(e) =>
                      setSettings(prev => ({
                        ...prev,
                        promotions: { ...prev.promotions!, sectionName: 'promotions', displayLimit: parseInt(e.target.value) || 4 }
                      }))
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-center mt-6">
            <Button variant="outline" onClick={() => window.open('/', '_blank')}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Preview Homepage
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
