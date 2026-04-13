/**
 * Load Trending News dari articles.json untuk index.html
 * Script ini mengganti trending news di sidebar dengan berita terbaru
 */

document.addEventListener('DOMContentLoaded', function() {
    const trendingContainer = document.querySelector('.bg-white.border.border-top-0.p-3');
    if (!trendingContainer) return;

    // Cari container trending news (yang ada di sidebar)
    const trendingItems = trendingContainer.querySelectorAll('.d-flex.align-items-center.bg-white.mb-3');
    if (trendingItems.length === 0) return;

    // Function untuk render trending news item
    function renderTrendingItem(article, index) {
        const item = document.createElement('div');
        item.className = 'd-flex align-items-center bg-white mb-3';
        item.style.height = '110px';

        const link = document.createElement('a');
        link.href = article.url || '#';

        const img = document.createElement('img');
        img.className = 'img-fluid';
        img.style.width = '110px';
        img.style.height = '110px';
        img.style.objectFit = 'cover';
        img.alt = '';
        img.src = (article.image && article.image.trim()) ? article.image : 'img/news-800x500-1.jpg';
        img.onerror = function(){ this.onerror=null; this.src = 'img/news-800x500-1.jpg'; };

        const content = document.createElement('div');
        content.className = 'w-100 h-100 px-3 d-flex flex-column justify-content-center border border-left-0';

        const meta = document.createElement('div');
        meta.className = 'mb-2';

        const badge = document.createElement('a');
        badge.className = 'badge badge-primary text-uppercase font-weight-semi-bold p-1 mr-2';
        badge.href = '';
        badge.textContent = article.category || 'Berita';

        const date = document.createElement('a');
        date.className = 'text-body';
        date.href = '';
        date.innerHTML = '<small>' + (article.date || '') + '</small>';

        meta.appendChild(badge);
        meta.appendChild(date);

        const title = document.createElement('a');
        title.className = 'h6 m-0 text-secondary text-uppercase font-weight-bold';
        title.href = article.url || '#';
        title.textContent = article.title || '';

        content.appendChild(meta);
        content.appendChild(title);

        link.appendChild(img);
        item.appendChild(link);
        item.appendChild(content);

        return item;
    }

    // Fetch articles.json dan update trending news
    fetch('articles.json')
        .then(response => {
            if (!response.ok) throw new Error('Failed to load articles.json');
            return response.text().then(text => JSON.parse(text.replace(/^\uFEFF/, '')));
        })
        .then(articles => {
            // Clear existing trending items
            trendingItems.forEach(item => item.remove());

            // Ambil 3 berita terbaru untuk trending news (skip 10 yang sudah di carousel)
            const trendingArticles = articles.slice(10, 13);

            // Render trending news items
            trendingArticles.forEach((article, index) => {
                trendingContainer.insertBefore(renderTrendingItem(article, index), trendingContainer.lastElementChild);
            });
        })
        .catch(err => {
            console.error('❌ Error loading articles.json for trending news:', err);
        });
});