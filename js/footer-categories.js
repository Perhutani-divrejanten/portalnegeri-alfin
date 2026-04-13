document.addEventListener('DOMContentLoaded', async function(){
    // Skip if main.js already populated footer (avoid duplicate buttons)
    if (window && window.footerCategoriesPopulated) return;
    const footer = document.getElementById('footerCategories');
    const sidebar = document.getElementById('sidebarCategories');
    const containers = [];
    if (footer) containers.push(footer);
    if (sidebar) containers.push(sidebar);
    if (containers.length === 0) return;

    // If footer already has category buttons (populated by other script), avoid duplicating
    if (footer && footer.children.length > 0) {
        try { window.footerCategoriesPopulated = true; } catch(e){}
        return;
    }

    function makeBtn(cat){
        const a = document.createElement('a');
        a.className = 'btn btn-sm btn-secondary m-1';
        a.href = '/search.html?q=' + encodeURIComponent(cat);
        a.textContent = cat;
        return a;
    }

    // canonical Indonesian fallback categories
    const fallback = ['Lingkungan','Ekonomi','Keamanan','Pendidikan','Pangan','Hukum','Olahraga','Teknologi','Kesehatan','Budaya'];

    function normalizeCategoryRaw(raw){
        if(!raw) return null;
        const s = raw.toString().trim().toLowerCase();
        const map = {
            // environment
            'environment':'Lingkungan','lingkungan':'Lingkungan','env':'Lingkungan','alam':'Lingkungan',
            // pangan / food
            'pangan':'Pangan','food':'Pangan','foods':'Pangan','ketahanan pangan':'Pangan','agriculture':'Pangan',
            // hukum / law
            'hukum':'Hukum','law':'Hukum','crime':'Hukum','hukuman':'Hukum',
            // keamanan / security
            'keamanan':'Keamanan','security':'Keamanan','safety':'Keamanan',
            // ekonomi / economy
            'ekonomi':'Ekonomi','economy':'Ekonomi','business':'Ekonomi','bisnis':'Ekonomi',
            // pendidikan / education
            'pendidikan':'Pendidikan','education':'Pendidikan','edukasi':'Pendidikan',
            // olahraga / sports
            'olahraga':'Olahraga','sports':'Olahraga','sport':'Olahraga',
            // teknologi / technology
            'teknologi':'Teknologi','technology':'Teknologi','tech':'Teknologi','digital':'Teknologi','digitalisasi':'Teknologi',
            // kesehatan / health
            'kesehatan':'Kesehatan','health':'Kesehatan',
            // budaya / culture
            'budaya':'Budaya','culture':'Budaya'
        };
        if(map[s]) return map[s];
        // try substring matching for variants
        for(const k of Object.keys(map)) if(s.indexOf(k)!==-1) return map[k];
        return null;
    }

    try{
        const resp = await fetch('articles.json');
        if (!resp.ok) throw new Error('no index');
        const raw = await resp.text();
        const data = JSON.parse(raw.replace(/^\uFEFF/, ''));
        const counts = {};
        data.forEach(a => {
            let raw = (a.category || '').toString().trim();
            if(!raw) return;
            let normalized = normalizeCategoryRaw(raw) || raw;
            counts[normalized] = (counts[normalized]||0) + 1;
        });

        const sorted = Object.keys(counts).sort((x,y)=> counts[y]-counts[x]);
        let top = sorted.slice(0,10);
        if (top.length === 0) top = fallback.slice(0,10);

        // clear containers first to avoid duplicates, then append
        containers.forEach(c => { c.innerHTML = ''; });
        top.forEach(cat => containers.forEach(container => container.appendChild(makeBtn(cat))));
        try{ window.footerCategoriesPopulated = true; }catch(e){}
    } catch(e){
        // render fallback into all containers
        containers.forEach(c => { c.innerHTML = ''; });
        fallback.slice(0,10).forEach(cat => containers.forEach(container => container.appendChild(makeBtn(cat))));
        try{ window.footerCategoriesPopulated = true; }catch(e){}
    }
});
