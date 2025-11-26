export enum SocialPlatform {
  INSTAGRAM = 'Instagram',
  LINKEDIN = 'LinkedIn',
  FACEBOOK = 'Facebook'
}

export enum ImageResolution {
  RES_1K = '1K',
  RES_2K = '2K',
  RES_4K = '4K'
}

export enum AspectRatio {
  SQUARE = '1:1',
  PORTRAIT = '3:4',
  LANDSCAPE = '16:9',
  STORY = '9:16'
}

export interface BrandIdentity {
  url: string;
  visualStyle: string;
  toneOfVoice: string;
  targetAudience: string;
  colorPalette: string;
}

export interface GeneratedContent {
  imageUrl: string;
  caption: string;
}

export interface NewsletterContent {
  subject: string;
  body: string;
}
