export const formatDate = (timestamp: string) => {
    if (!timestamp) return 'Unknown date';

    try {
        const date = new Date(timestamp);
        return new Intl.DateTimeFormat('pt-BR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(date);
    } catch (error) {
        return 'Invalid date';
    }
};

export const stripHtml = (html: string) => {
    if (!html) return '';
    return html.replace(/<\/?[^>]+(>|$)/g, " ").replace(/\s+/g, " ").trim();
};

export const hasAudio = (content: string) => {
    if (!content) return false;
    
    return content.includes('class="audio-embed"') || 
           content.includes('data-audio-src') || 
           content.includes('<audio');
};

export const extractAudioUrl = (content: string) => {
    if (!content) return null;
    
    
    const audioSrcMatch = content.match(/data-audio-src=["']([^"']+)["']/);
    if (audioSrcMatch) {
        const url = cleanAudioUrl(audioSrcMatch[1]);
        return getProxiedAudioUrl(url);
    }
    
    const audioTagMatch = content.match(/<audio[^>]+src=["']([^"']+)["']/);
    if (audioTagMatch) {
        const url = cleanAudioUrl(audioTagMatch[1]);
        return getProxiedAudioUrl(url);
    }
    
    const audioEmbedMatch = content.match(/class=["']audio-embed["'][^>]*>[\s\S]*?src=["']([^"']+)["']/);
    if (audioEmbedMatch) {
        const url = cleanAudioUrl(audioEmbedMatch[1]);
        return getProxiedAudioUrl(url);
    }
    
    return null;
};

const cleanAudioUrl = (url: string): string => {
    if (!url) return url;
    const decoded = url
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
    const cleaned = decoded.replace(/&+$/, '');
    return cleaned;
};

export const getProxiedAudioUrl = (originalUrl: string): string => {
    if (!originalUrl) return originalUrl;
    
    const corsProblematicDomains = [
        'cdn.discordapp.com',
        'discord.com',
        'drive.google.com',
        'dropbox.com'
    ];
    
    const needsProxy = corsProblematicDomains.some(domain => originalUrl.includes(domain));
    return needsProxy ? originalUrl : originalUrl;
};