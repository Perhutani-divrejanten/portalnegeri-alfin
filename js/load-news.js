/**
 * Load News dari articles.json
 * Script ini otomatis populate newsContainer di news.html dengan artikel dari articles.json
 */

document.addEventListener('DOMContentLoaded', function() {
    const newsContainer = document.getElementById('newsContainer');
    if (!newsContainer) return;

    function escapeHTML(str) {
        return String(str || '').replace(/[&<>"'`]/g, function(s){
            return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;","`":"&#96;"})[s];
        });
    }

    // Function untuk render news item (DOM-safe)
    function renderNewsItem(article) {
        const col = document.createElement('div');
        col.className = 'col-12 mb-3';

        const a = document.createElement('a');
        a.href = article.url || '#';
        a.style.textDecoration = 'none';
        a.style.color = 'inherit';

        const outer = document.createElement('div');
        outer.className = 'd-flex align-items-center bg-white border p-3';

        const img = document.createElement('img');
        img.style.width = '180px';
        img.style.height = '120px';
        img.style.objectFit = 'cover';
        img.alt = article.title || '';
        img.src = (article.image && article.image.trim()) ? article.image : 'img/berita10.png';
        img.onerror = function(){ this.onerror=null; this.src = 'img/berita10.png'; };

        const inner = document.createElement('div');
        inner.className = 'pl-3 w-100';

        const meta = document.createElement('div');
        meta.className = 'mb-2';

        const badge = document.createElement('span');
        badge.className = 'badge badge-primary text-uppercase font-weight-semi-bold p-1 mr-2';
        badge.textContent = article.category || 'Berita';

        const dateSmall = document.createElement('small');
        dateSmall.className = 'text-muted';
        dateSmall.innerHTML = '<i class="fa fa-calendar-alt mr-1" aria-hidden="true"></i> ' + escapeHTML(article.date || '');

        meta.appendChild(badge);
        meta.appendChild(dateSmall);

        const h5 = document.createElement('h5');
        h5.className = 'font-weight-bold text-uppercase text-secondary';
        h5.textContent = article.title || '';

        const p = document.createElement('p');
        p.className = 'm-0';
        const excerpt = (article.excerpt || '');
        p.textContent = excerpt.length > 200 ? excerpt.substring(0,200) + '...' : excerpt;

        inner.appendChild(meta);
        inner.appendChild(h5);
        inner.appendChild(p);

        outer.appendChild(img);
        outer.appendChild(inner);
        a.appendChild(outer);
        col.appendChild(a);
        return col;
    }

    // Fetch articles.json dan render (use relative path)
    fetch('articles.json')
        .then(response => {
            if (!response.ok) throw new Error('Failed to load articles.json');
            return response.text().then(text => JSON.parse(text.replace(/^\uFEFF/, '')));
        })
        .then(articles => {
            // Clear existing hardcoded items
            newsContainer.innerHTML = '';

            // Render semua artikel dari articles.json
            articles.forEach(article => {
                newsContainer.appendChild(renderNewsItem(article));
            });

            // after rendering, trigger pagination if load-more script exists
            function maybeInitLoadMore() {
                if (typeof initializeLoadMore === 'function') {
                    initializeLoadMore();
                } else {
                    setTimeout(maybeInitLoadMore, 100);
                }
            }
            maybeInitLoadMore();
        })
        .catch(err => {
            console.error('❌ Error loading articles.json:', err);
            // Fallback: keep existing hardcoded items jika JSON load gagal
        });
});
