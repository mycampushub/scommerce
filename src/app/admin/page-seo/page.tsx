'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2, Save, Eye, Edit, Trash2 } from 'lucide-react'

interface PageSeoData {
  id: string
  pagePath: string
  pageTitle: string | null
  metaTitle: string | null
  metaDescription: string | null
  keywords: string | null
  ogTitle: string | null
  ogDescription: string | null
  ogImage: string | null
  canonicalUrl: string | null
  robots: string | null
  isActive: number
}

interface PredefinedPage {
  path: string
  name: string
  description: string
}

const predefinedPages: PredefinedPage[] = [
  { path: '/', name: 'Homepage', description: 'Main homepage of the store' },
  { path: '/shop', name: 'Shop Page', description: 'All products listing page' },
  { path: '/search', name: 'Search Page', description: 'Product search results page' },
  { path: '/contact', name: 'Contact Page', description: 'Contact form and information' },
  { path: '/about', name: 'About Page', description: 'About us and company information' },
  { path: '/cart', name: 'Cart Page', description: 'Shopping cart page' },
  { path: '/checkout', name: 'Checkout Page', description: 'Checkout process page' },
  { path: '/login', name: 'Login Page', description: 'User login page' },
  { path: '/register', name: 'Register Page', description: 'User registration page' },
  { path: '/wishlist', name: 'Wishlist Page', description: 'User wishlist page' },
  { path: '/returns', name: 'Returns Page', description: 'Returns and refunds policy' },
  { path: '/shipping', name: 'Shipping Page', description: 'Shipping information page' },
  { path: '/privacy', name: 'Privacy Policy', description: 'Privacy policy page' },
  { path: '/terms', name: 'Terms Page', description: 'Terms and conditions page' },
  { path: '/faq', name: 'FAQ Page', description: 'Frequently asked questions' },
  { path: '/track-order', name: 'Track Order', description: 'Order tracking page' },
]

export default function PageSeoManager() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [seoSettings, setSeoSettings] = useState<PageSeoData[]>([])
  const [editingPage, setEditingPage] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<PageSeoData>>({})

  // Fetch all SEO settings
  const fetchSeoSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/seo')
      const data = await response.json()
      if (data.success) {
        setSeoSettings(data.data)
      }
    } catch (error) {
      console.error('Error fetching SEO settings:', error)
      toast.error('Failed to load SEO settings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSeoSettings()
  }, [])

  const handleEdit = (page: PageSeoData | PredefinedPage) => {
    const pagePath = 'path' in page ? page.path : page.pagePath
    const existingSeo = seoSettings.find(s => s.pagePath === pagePath)
    if (existingSeo) {
      setFormData({ ...existingSeo })
      setEditingPage(existingSeo.id)
    } else {
      setFormData({
        pagePath: pagePath,
        pageTitle: null,
        metaTitle: null,
        metaDescription: null,
        keywords: null,
        ogTitle: null,
        ogDescription: null,
        ogImage: null,
        canonicalUrl: null,
        robots: 'index, follow',
        isActive: 1
      })
      setEditingPage('new')
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      const isUpdate = editingPage !== 'new' && editingPage !== null

      const response = await fetch(isUpdate ? '/api/admin/seo' : '/api/admin/seo', {
        method: isUpdate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        toast.success('SEO settings saved successfully!')
        setEditingPage(null)
        setFormData({})
        fetchSeoSettings()
      } else {
        toast.error(data.error || 'Failed to save SEO settings')
      }
    } catch (error) {
      console.error('Error saving SEO settings:', error)
      toast.error('Failed to save SEO settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditingPage(null)
    setFormData({})
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this SEO setting?')) return

    try {
      const response = await fetch(`/api/admin/seo?id=${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        toast.success('SEO setting deleted successfully!')
        fetchSeoSettings()
      } else {
        toast.error(data.error || 'Failed to delete SEO setting')
      }
    } catch (error) {
      console.error('Error deleting SEO setting:', error)
      toast.error('Failed to delete SEO setting')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Page SEO Management</h1>
        <p className="text-gray-600">
          Manage SEO meta tags and settings for each page of your store
        </p>
      </div>

      {editingPage ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingPage === 'new' ? 'Add New Page SEO' : 'Edit Page SEO'}
            </CardTitle>
            <CardDescription>
              Configure SEO metadata for: <code className="bg-gray-100 px-2 py-1 rounded">{formData.pagePath}</code>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="pageTitle">Page Heading (H1)</Label>
              <Input
                id="pageTitle"
                value={formData.pageTitle || ''}
                onChange={(e) => setFormData({ ...formData, pageTitle: e.target.value })}
                placeholder="Main heading displayed on the page"
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">
                This is the main heading (H1) shown on the page. Leave blank to use default.
              </p>
            </div>

            <div>
              <Label htmlFor="metaTitle">Meta Title</Label>
              <Input
                id="metaTitle"
                value={formData.metaTitle || ''}
                onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                placeholder="SEO title for search results"
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">
                Recommended: 50-60 characters. Currently: {(formData.metaTitle || '').length} characters
              </p>
            </div>

            <div>
              <Label htmlFor="metaDescription">Meta Description</Label>
              <Textarea
                id="metaDescription"
                value={formData.metaDescription || ''}
                onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                placeholder="SEO description for search results"
                rows={3}
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">
                Recommended: 150-160 characters. Currently: {(formData.metaDescription || '').length} characters
              </p>
            </div>

            <div>
              <Label htmlFor="keywords">Keywords</Label>
              <Textarea
                id="keywords"
                value={formData.keywords || ''}
                onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                placeholder="comma, separated, keywords"
                rows={2}
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">
                Comma-separated keywords for search engines
              </p>
            </div>

            <div>
              <Label htmlFor="ogTitle">Open Graph Title (Social Media)</Label>
              <Input
                id="ogTitle"
                value={formData.ogTitle || ''}
                onChange={(e) => setFormData({ ...formData, ogTitle: e.target.value })}
                placeholder="Title when shared on social media"
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">
                Leave blank to use meta title
              </p>
            </div>

            <div>
              <Label htmlFor="ogDescription">Open Graph Description</Label>
              <Textarea
                id="ogDescription"
                value={formData.ogDescription || ''}
                onChange={(e) => setFormData({ ...formData, ogDescription: e.target.value })}
                placeholder="Description when shared on social media"
                rows={2}
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">
                Leave blank to use meta description
              </p>
            </div>

            <div>
              <Label htmlFor="ogImage">Open Graph Image URL</Label>
              <Input
                id="ogImage"
                value={formData.ogImage || ''}
                onChange={(e) => setFormData({ ...formData, ogImage: e.target.value })}
                placeholder="https://example.com/og-image.jpg"
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">
                Image shown when shared on social media (1200x630px recommended)
              </p>
            </div>

            <div>
              <Label htmlFor="canonicalUrl">Canonical URL</Label>
              <Input
                id="canonicalUrl"
                value={formData.canonicalUrl || ''}
                onChange={(e) => setFormData({ ...formData, canonicalUrl: e.target.value })}
                placeholder="https://example.com/page"
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">
                Preferred URL for search engines to avoid duplicate content
              </p>
            </div>

            <div>
              <Label htmlFor="robots">Robots Meta Tag</Label>
              <select
                id="robots"
                value={formData.robots || 'index, follow'}
                onChange={(e) => setFormData({ ...formData, robots: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value="index, follow">index, follow (Default)</option>
                <option value="noindex, follow">noindex, follow</option>
                <option value="index, nofollow">index, nofollow</option>
                <option value="noindex, nofollow">noindex, nofollow</option>
              </select>
              <p className="text-sm text-gray-500 mt-1">
                Control how search engines crawl this page
              </p>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save SEO Settings
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleCancel} disabled={saving}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Predefined Pages</CardTitle>
              <CardDescription>
                Common pages in your store. Click to configure SEO settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {predefinedPages.map((page) => {
                  const hasSeo = seoSettings.find(s => s.pagePath === page.path)
                  return (
                    <div
                      key={page.path}
                      className="border rounded-lg p-4 hover:border-pink-600 transition-colors cursor-pointer group"
                      onClick={() => handleEdit(page)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-gray-900">{page.name}</h3>
                            {hasSeo && <Badge className="bg-green-100 text-green-700">Configured</Badge>}
                          </div>
                          <p className="text-sm text-gray-500 mb-2">{page.description}</p>
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded block">{page.path}</code>
                        </div>
                        <Edit className="w-4 h-4 text-gray-400 group-hover:text-pink-600" />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {seoSettings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Configured Pages</CardTitle>
                <CardDescription>
                  Pages with custom SEO settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {seoSettings.map((seo) => (
                    <div
                      key={seo.id}
                      className="flex items-center justify-between p-4 border rounded-lg bg-white"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded">{seo.pagePath}</code>
                          {seo.isActive ? (
                            <Badge className="bg-green-100 text-green-700">Active</Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-700">Inactive</Badge>
                          )}
                        </div>
                        {seo.metaTitle && (
                          <p className="text-sm text-gray-600 truncate max-w-md">
                            Title: {seo.metaTitle}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(seo)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(seo.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}