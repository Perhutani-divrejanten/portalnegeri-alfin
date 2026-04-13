/**
 * Load Main Carousel dari articles.json untuk index.html
 * Script ini mengganti carousel utama dengan berita terbaru dari articles.json
 */

document.addEventListener('DOMContentLoaded', function() {
    const mainCarousel = document.querySelector('.main-carousel');
    if (!mainCarousel) return;

    function escapeHTML(str) {
        return String(str || '').replace(/[&<>"'`]/g, function(s){
            return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;","`":"&#96;"})[s];
        });
    }

    // Function untuk render carousel item
    function renderCarouselItem(article, index) {
        const item = document.createElement('div');
        item.className = 'position-relative overflow-hidden';
        item.style.height = '500px';

        const link = document.createElement('a');
        link.href = article.url || '#';

        const img = document.createElement('img');
        img.className = 'img-fluid h-100';
        img.style.objectFit = 'cover';
        img.alt = article.title || '';
        img.src = (article.image && article.image.trim()) ? article.image : 'img/news-800x500-1.jpg';
        img.onerror = function(){ this.onerror=null; this.src = 'img/news-800x500-1.jpg'; };

        const overlay = document.createElement('div');
        overlay.className = 'overlay';

        const meta = document.createElement('div');
        meta.className = 'mb-2';

        const badge = document.createElement('a');
        badge.className = 'badge badge-primary text-uppercase font-weight-semi-bold p-2 mr-2';
        badge.href = '';
        badge.textContent = article.category || 'Berita';

        const date = document.createElement('a');
        date.className = 'text-white';
        date.href = '';
        date.textContent = article.date || '';

        meta.appendChild(badge);
        meta.appendChild(date);

        const title = document.createElement('a');
        title.className = 'h2 m-0 text-white text-uppercase font-weight-bold';
        title.href = article.url || '#';
        title.textContent = article.title || '';

        overlay.appendChild(meta);
        overlay.appendChild(title);

        link.appendChild(img);
        link.appendChild(overlay);
        item.appendChild(link);

        return item;
    }

    // Fetch articles.json dan update carousel
    fetch('articles.json')
        .then(response => {
            if (!response.ok) throw new Error('Failed to load articles.json');
            return response.text().then(text => JSON.parse(text.replace(/^\uFEFF/, '')));
        })
        .then(articles => {
            // Clear existing carousel items
            mainCarousel.innerHTML = '';

            // Ambil 4 berita terbaru untuk carousel
            const latestArticles = articles.slice(0, 4);

            // Render carousel items
            latestArticles.forEach((article, index) => {
                mainCarousel.appendChild(renderCarouselItem(article, index));
            });

            // Re-initialize Owl Carousel if it exists
            if (typeof $.fn.owlCarousel === 'function' && mainCarousel.closest('.owl-carousel')) {
                const $carousel = $(mainCarousel);
                $carousel.trigger('destroy.owl.carousel');
                $carousel.html($carousel.find('.owl-stage-outer').html()).removeClass('owl-loaded');
                $carousel.owlCarousel({
                    autoplay: true,
                    smartSpeed: 1500,
                    items: 1,
                    dots: false,
                    loop: true,
                    nav: true,
                    navText: ['<i class="fa fa-angle-left" aria-hidden="true"></i>', '<i class="fa fa-angle-right" aria-hidden="true"></i>']
                });
            }
        })
        .catch(err => {
            console.error('❌ Error loading articles.json for carousel:', err);
        });
});