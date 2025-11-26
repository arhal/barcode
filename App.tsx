import React, { useState } from 'react';
import { SocialPlatform, ImageResolution, AspectRatio, BrandIdentity, GeneratedContent, NewsletterContent } from './types';
import * as GeminiService from './services/geminiService';
import { compositeWatermark } from './components/WatermarkCompositor';
import { 
  NewspaperIcon, 
  PhotoIcon, 
  GlobeAltIcon, 
  ArrowPathIcon,
  ShareIcon,
  CloudArrowUpIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const App: React.FC = () => {
  // --- State ---
  const [activeTab, setActiveTab] = useState<'social' | 'newsletter'>('social');
  const [isLoading, setIsLoading] = useState(false);
  
  // Brand
  const [brandUrl, setBrandUrl] = useState('');
  const [brandIdentity, setBrandIdentity] = useState<BrandIdentity | null>(null);
  const [isAnalyzingBrand, setIsAnalyzingBrand] = useState(false);

  // Social Post State
  const [platform, setPlatform] = useState<SocialPlatform>(SocialPlatform.INSTAGRAM);
  const [postPrompt, setPostPrompt] = useState('');
  const [resolution, setResolution] = useState<ImageResolution>(ImageResolution.RES_1K);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.SQUARE);
  const [logoFile, setLogoFile] = useState<string | null>(null);
  const [generatedPost, setGeneratedPost] = useState<GeneratedContent | null>(null);

  // Newsletter State
  const [newsTopic, setNewsTopic] = useState('');
  const [newsAudience, setNewsAudience] = useState('General Subscribers');
  const [newsletter, setNewsletter] = useState<NewsletterContent | null>(null);

  // --- Handlers ---

  const handleBrandAnalysis = async () => {
    if (!brandUrl) return;
    setIsAnalyzingBrand(true);
    try {
      const identity = await GeminiService.analyzeBrandIdentity(brandUrl);
      setBrandIdentity(identity);
    } catch (error) {
      console.error(error);
      alert("Failed to analyze brand identity. Please check the URL and try again.");
    } finally {
      setIsAnalyzingBrand(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoFile(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateSocial = async () => {
    if (!postPrompt) return;
    setIsLoading(true);
    try {
      // 1. Generate Caption
      const captionPromise = GeminiService.generateSocialCaption(postPrompt, platform, brandIdentity);
      
      // 2. Generate Image
      const imagePromise = GeminiService.generateSocialImage(postPrompt, brandIdentity, resolution, aspectRatio);

      const [caption, rawImage] = await Promise.all([captionPromise, imagePromise]);

      // 3. Apply Watermark if logo exists
      let finalImage = rawImage;
      if (logoFile) {
        finalImage = await compositeWatermark(rawImage, logoFile);
      }

      setGeneratedPost({
        imageUrl: finalImage,
        caption: caption
      });
    } catch (error) {
      console.error(error);
      alert("Failed to generate content. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateNewsletter = async () => {
    if (!newsTopic) return;
    setIsLoading(true);
    try {
      const content = await GeminiService.generateNewsletterContent(newsTopic, newsAudience, brandIdentity);
      setNewsletter(content);
    } catch (error) {
      console.error(error);
      alert("Failed to generate newsletter.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- UI Components ---

  return (
    <div className="flex h-screen bg-gray-900 text-white selection:bg-indigo-500 selection:text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-6 border-b border-gray-700">
           <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">BrandGen Pro</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('social')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'social' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}
          >
            <PhotoIcon className="w-5 h-5" />
            Social Studio
          </button>
          <button 
            onClick={() => setActiveTab('newsletter')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'newsletter' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}
          >
            <NewspaperIcon className="w-5 h-5" />
            Newsletter
          </button>
        </nav>

        {/* Brand Identity Widget */}
        <div className="p-4 border-t border-gray-700 bg-gray-800/50">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Brand Identity</div>
            {brandIdentity ? (
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-green-400">
                        <CheckCircleIcon className="w-4 h-4" />
                        <span className="text-sm font-medium truncate">{brandIdentity.url}</span>
                    </div>
                    <div className="text-xs text-gray-400 line-clamp-2">{brandIdentity.visualStyle}</div>
                    <button 
                        onClick={() => setBrandIdentity(null)}
                        className="text-xs text-red-400 hover:text-red-300 mt-2"
                    >
                        Reset Brand
                    </button>
                </div>
            ) : (
                <div className="space-y-2">
                    <input 
                        type="text" 
                        value={brandUrl}
                        onChange={(e) => setBrandUrl(e.target.value)}
                        placeholder="https://yourbrand.com"
                        className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none transition-colors"
                    />
                    <button 
                        onClick={handleBrandAnalysis}
                        disabled={isAnalyzingBrand || !brandUrl}
                        className="w-full bg-gray-700 hover:bg-gray-600 text-xs py-2 rounded flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                    >
                        {isAnalyzingBrand ? <ArrowPathIcon className="w-3 h-3 animate-spin" /> : <GlobeAltIcon className="w-3 h-3" />}
                        Analyze Brand
                    </button>
                </div>
            )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        {isLoading && (
             <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center flex-col gap-4">
                <div className="relative w-16 h-16">
                    <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-500/30 rounded-full"></div>
                    <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
                </div>
                <span className="text-indigo-300 font-medium animate-pulse">Generating Creative Content...</span>
             </div>
        )}

        <div className="max-w-5xl mx-auto p-8">
            
            {activeTab === 'social' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Configuration Column */}
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-3xl font-bold mb-2">Create Social Post</h2>
                            <p className="text-gray-400">Generate platform-optimized content with AI.</p>
                        </div>

                        <div className="space-y-4 bg-gray-800/40 p-6 rounded-xl border border-gray-700">
                            
                            {/* Platform Selector */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Target Platform</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {Object.values(SocialPlatform).map((p) => (
                                        <button
                                            key={p}
                                            onClick={() => setPlatform(p)}
                                            className={`py-2 text-sm rounded-md border transition-all ${platform === p ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-500'}`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Prompt Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">What do you want to post?</label>
                                <textarea
                                    rows={4}
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none text-gray-200"
                                    placeholder="Describe your post topic, scene, or promotional message..."
                                    value={postPrompt}
                                    onChange={(e) => setPostPrompt(e.target.value)}
                                />
                            </div>

                            {/* Image Settings Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="opacity-50 pointer-events-none">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Resolution (Flash Auto)</label>
                                    <select 
                                        value={resolution} 
                                        disabled
                                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-sm"
                                    >
                                        <option>1K (Default)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Aspect Ratio</label>
                                    <select 
                                        value={aspectRatio} 
                                        onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-sm focus:outline-none focus:border-indigo-500"
                                    >
                                        {Object.values(AspectRatio).map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Logo Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Watermark Logo (Optional)</label>
                                <div className="flex items-center gap-4">
                                    <label className="flex-1 cursor-pointer bg-gray-900 border border-dashed border-gray-600 hover:border-indigo-500 rounded-lg p-4 flex flex-col items-center justify-center transition-colors group">
                                        <CloudArrowUpIcon className="w-6 h-6 text-gray-500 group-hover:text-indigo-400" />
                                        <span className="text-xs text-gray-500 mt-1 group-hover:text-gray-300">Upload PNG</span>
                                        <input type="file" accept="image/png, image/jpeg" className="hidden" onChange={handleLogoUpload} />
                                    </label>
                                    {logoFile && (
                                        <div className="w-16 h-16 bg-gray-700 rounded-lg border border-gray-600 flex items-center justify-center overflow-hidden">
                                            <img src={logoFile} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={handleGenerateSocial}
                                disabled={!postPrompt || isLoading}
                                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-lg font-bold shadow-lg shadow-indigo-900/40 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:scale-100"
                            >
                                Generate Post
                            </button>
                        </div>
                    </div>

                    {/* Output Column */}
                    <div className="space-y-6">
                        <h2 className="text-3xl font-bold mb-2 opacity-0 lg:opacity-100">Preview</h2>
                        
                        {generatedPost ? (
                            <div className="bg-white text-gray-900 rounded-xl overflow-hidden shadow-2xl shadow-black/50">
                                {/* Mock Social Header */}
                                <div className="p-4 border-b flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                                    <div className="flex-1">
                                        <div className="h-3 w-24 bg-gray-200 rounded mb-1"></div>
                                        <div className="h-2 w-16 bg-gray-100 rounded"></div>
                                    </div>
                                    <div className="text-gray-400 text-xs">{platform}</div>
                                </div>

                                {/* Image */}
                                <div className="bg-gray-100 relative group cursor-pointer">
                                    <img src={generatedPost.imageUrl} alt="Generated Content" className="w-full h-auto object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <a href={generatedPost.imageUrl} download="social-post.png" className="bg-white text-gray-900 px-4 py-2 rounded-full font-medium flex items-center gap-2 hover:bg-gray-100">
                                            <ArrowPathIcon className="w-4 h-4" /> Download
                                        </a>
                                    </div>
                                </div>

                                {/* Caption & Actions */}
                                <div className="p-4 space-y-3">
                                    <div className="flex gap-4 text-gray-400">
                                        <div className="w-6 h-6 bg-gray-200 rounded"></div>
                                        <div className="w-6 h-6 bg-gray-200 rounded"></div>
                                        <div className="w-6 h-6 bg-gray-200 rounded"></div>
                                    </div>
                                    <div className="space-y-1">
                                         <p className="text-sm whitespace-pre-wrap">{generatedPost.caption}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-[600px] border-2 border-dashed border-gray-700 rounded-xl flex flex-col items-center justify-center text-gray-500">
                                <PhotoIcon className="w-16 h-16 mb-4 opacity-20" />
                                <p>Generated content will appear here</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'newsletter' && (
                <div className="max-w-3xl mx-auto space-y-8">
                    <div>
                        <h2 className="text-3xl font-bold mb-2">Newsletter Generator</h2>
                        <p className="text-gray-400">Create engaging email content tailored to your audience.</p>
                    </div>

                    <div className="grid gap-6 bg-gray-800/40 p-6 rounded-xl border border-gray-700">
                        <div>
                             <label className="block text-sm font-medium text-gray-300 mb-2">Newsletter Topic</label>
                             <input 
                                type="text"
                                value={newsTopic}
                                onChange={(e) => setNewsTopic(e.target.value)}
                                placeholder="e.g. Monthly product roundup, Industry insights..."
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-gray-200"
                             />
                        </div>

                        <div>
                             <label className="block text-sm font-medium text-gray-300 mb-2">Target Audience</label>
                             <input 
                                type="text"
                                value={newsAudience}
                                onChange={(e) => setNewsAudience(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-gray-200"
                             />
                        </div>

                        <button
                            onClick={handleGenerateNewsletter}
                            disabled={!newsTopic || isLoading}
                            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg font-bold shadow-lg shadow-purple-900/40 transition-all"
                        >
                            Generate Newsletter
                        </button>
                    </div>

                    {newsletter && (
                         <div className="bg-white text-gray-800 rounded-lg shadow-lg overflow-hidden">
                            <div className="bg-gray-50 p-4 border-b">
                                <div className="text-sm text-gray-500 mb-1">Subject Line</div>
                                <h3 className="font-bold text-lg">{newsletter.subject}</h3>
                            </div>
                            <div className="p-8 prose max-w-none">
                                <pre className="whitespace-pre-wrap font-sans text-base leading-relaxed text-gray-700">{newsletter.body}</pre>
                            </div>
                            <div className="bg-gray-50 p-4 border-t flex justify-end">
                                <button className="text-indigo-600 font-medium text-sm flex items-center gap-2 hover:text-indigo-800">
                                    <ShareIcon className="w-4 h-4" /> Copy to Clipboard
                                </button>
                            </div>
                         </div>
                    )}
                </div>
            )}
        </div>
      </main>
    </div>
  );
};

export default App;