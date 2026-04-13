/**
 * Load Featured News dari articles.json untuk index.html
 * Script ini mengganti featured news carousel dengan berita terbaru
 */

document.addEventListener('DOMContentLoaded', function() {
    const featuredNews = document.querySelector('.news-carousel');
    if (!featuredNews) return;

    // Function untuk render featured news item
    function renderFeaturedItem(article) {
        const item = document.createElement('div');
        item.className = 'position-relative overflow-hidden';
        item.style.height = '300px';

        const link = document.createElement('a');
        link.href = article.url || '#';

        const img = document.createElement('img');
        img.className = 'img-fluid h-100';
        img.style.objectFit = 'cover';
        img.alt = article.title || '';
        img.src = (article.image && article.image.trim()) ? article.image : 'img/news-700x435-1.jpg';
        img.onerror = function(){ this.onerror=null; this.src = 'img/news-700x435-1.jpg'; };

        const overlay = document.createElement('div');
        overlay.className = 'overlay';

        const meta = document.createElement('div');
        meta.className = 'mb-2';

        const badge = document.createElement('a');
        badge.className = 'badge badge-primary news-badge mr-2';
        badge.href = '';
        badge.textContent = article.category || 'Berita';

        const date = document.createElement('a');
        date.className = 'text-white';
        date.href = '';
        date.innerHTML = '<small>' + (article.date || '') + '</small>';

        meta.appendChild(badge);
        meta.appendChild(date);

        const title = document.createElement('a');
        title.className = 'h6 m-0 text-white text-uppercase font-weight-semi-bold';
        title.href = article.url || '#';
        title.textContent = article.title || '';

        overlay.appendChild(meta);
        overlay.appendChild(title);

        link.appendChild(img);
        link.appendChild(overlay);
        item.appendChild(link);

        return item;
    }

    // Fetch articles.json dan update featured news
    fetch('articles.json')
        .then(response => {
            if (!response.ok) throw new Error('Failed to load articles.json');
            return response.text().then(text => JSON.parse(text.replace(/^\uFEFF/, '')));
        })
        .then(articles => {
            // Clear existing items
            featuredNews.innerHTML = '';

// Ambil 15 berita terbaru untuk featured news (skip 4 yang sudah di main carousel)
    // slice(4, 19) akan mencoba mengambil indices 4..18, tetapi jika tidak cukup artikel
    // maka hanya yang tersedia yang ditampilkan. Carousel akan tetap dapat digeser manual.
    const featuredArticles = articles.slice(4, 19);

            // Render featured news items
            featuredArticles.forEach(article => {
                featuredNews.appendChild(renderFeaturedItem(article));
            });

            // Re-initialize Owl Carousel if it exists
            if (typeof $.fn.owlCarousel === 'function' && featuredNews.closest('.owl-carousel')) {
                const $carousel = $(featuredNews);
                $carousel.trigger('destroy.owl.carousel');
                $carousel.html($carousel.find('.owl-stage-outer').html()).removeClass('owl-loaded');
                $carousel.owlCarousel({
                    autoplay: true,
                    smartSpeed: 1000,
                    margin: 30,
                    dots: false,
                    loop: true,
                    nav: true,
                    navText: ['<i class="fa fa-angle-left" aria-hidden="true"></i>', '<i class="fa fa-angle-right" aria-hidden="true"></i>'],
                    responsive: {
                                0: { items: 1 },
                        576: { items: 1 },
                        768: { items: 2 },
                        992: { items: 3 },
                        1200: { items: 4 },
                        1600: { items: 5 } // allow a fifth item on very wide screens
                    }
                });
            }
        })
        .catch(err => {
            console.error('❌ Error loading articles.json for featured news:', err);
        });
});