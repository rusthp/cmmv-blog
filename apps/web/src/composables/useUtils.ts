export const formatDate = (timestamp: string) => {
    if (!timestamp) return 'Unknown date';

    try {
        const date = new Date(timestamp);
        return new Intl.DateTimeFormat('en-US', {
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

export const hasAudio = (content: string | undefined): boolean => {
    if (!content) return false;
    return content.includes('<audio') || 
           content.includes('[audio') || 
           content.includes('<iframe src="https://open.spotify.com') ||
           content.includes('<iframe src="https://w.soundcloud.com');
};

export const extractAudioUrl = (content: string | undefined): string | null => {
    if (!content) return null;
    
    // Procura por tags de áudio HTML5
    const audioTagMatch = content.match(/<audio[^>]*src=["']([^"']+)["'][^>]*>/i);
    if (audioTagMatch && audioTagMatch[1]) {
        return audioTagMatch[1];
    }
    
    // Procura por shortcode de áudio WordPress
    const shortcodeMatch = content.match(/\[audio[^\]]*src=["']([^"']+)["'][^\]]*\]/i);
    if (shortcodeMatch && shortcodeMatch[1]) {
        return shortcodeMatch[1];
    }
    
    // Procura por iframes de Spotify ou SoundCloud
    const iframeMatch = content.match(/<iframe[^>]*src=["']([^"']+)["'][^>]*>/i);
    if (iframeMatch && iframeMatch[1]) {
        return iframeMatch[1];
    }
    
    return null;
};