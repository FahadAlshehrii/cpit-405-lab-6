/*
    CPIT-405 - Lab 06: Cookies (Like / Dislike and Comment)
    Student: Fahad Alshehri
    ID: 2338900
*/

const COOKIE_DAYS = 30;
const COOKIE_NAMES = ['vote', 'likes', 'dislikes', 'comments'];

/* ---------- Cookie helpers ---------- */

function setCookie(name, value, days = COOKIE_DAYS) {
    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${maxAge}; path=/; SameSite=Lax`;
}

function getCookie(name) {
    const pair = document.cookie
        .split('; ')
        .find((part) => part.startsWith(`${name}=`));
    return pair ? decodeURIComponent(pair.substring(name.length + 1)) : null;
}

function deleteCookie(name) {
    document.cookie = `${name}=; max-age=0; path=/; SameSite=Lax`;
}

// Some browsers do not save cookies for pages opened straight from a file
// (file://), so check once that a cookie can be written and read back.
function cookiesWork() {
    setCookie('cookieTest', '1', 1);
    const works = getCookie('cookieTest') === '1';
    deleteCookie('cookieTest');
    return works;
}

/* ---------- Page elements ---------- */

const likeBtn = document.getElementById('likeBtn');
const dislikeBtn = document.getElementById('dislikeBtn');
const likeCount = document.getElementById('likeCount');
const dislikeCount = document.getElementById('dislikeCount');
const voteStatus = document.getElementById('voteStatus');

const commentForm = document.getElementById('commentForm');
const commentInput = document.getElementById('commentInput');
const commentBtn = document.getElementById('commentBtn');
const commentStatus = document.getElementById('commentStatus');
const commentList = document.getElementById('commentList');

const cookieWarning = document.getElementById('cookieWarning');
const cookieView = document.getElementById('cookieView');
const resetBtn = document.getElementById('resetBtn');

/* ---------- State (loaded from cookies) ---------- */

// Comments are saved as a JSON array: [{ "text": "...", "date": "2026-10-28T..." }]
function readComments() {
    const saved = getCookie('comments');
    if (!saved) return [];
    try {
        const comments = JSON.parse(saved);
        return Array.isArray(comments)
            ? comments.filter((comment) => comment && typeof comment.text === 'string')
            : [];
    } catch {
        return [];
    }
}

function loadState() {
    return {
        vote: getCookie('vote'), // "like", "dislike" or null
        likes: Number(getCookie('likes')) || 0,
        dislikes: Number(getCookie('dislikes')) || 0,
        comments: readComments(),
    };
}

// one comment per user: once the user has a saved comment, commenting is closed
const hasCommented = () => state.comments.length > 0;

let state = loadState();

/* ---------- Show the state on the page ---------- */

function render() {
    // votes
    likeCount.textContent = state.likes;
    dislikeCount.textContent = state.dislikes;
    likeBtn.disabled = state.vote !== null;
    dislikeBtn.disabled = state.vote !== null;
    likeBtn.setAttribute('aria-pressed', String(state.vote === 'like'));
    dislikeBtn.setAttribute('aria-pressed', String(state.vote === 'dislike'));

    // comments
    commentInput.disabled = hasCommented();
    commentBtn.disabled = hasCommented();

    commentList.replaceChildren();
    state.comments.forEach((comment) => {
        const item = document.createElement('li');
        // textContent shows the comment as plain text, so HTML in it is not run
        item.textContent = comment.text;
        const date = document.createElement('span');
        date.className = 'comment-date';
        date.textContent = new Date(comment.date).toLocaleString();
        item.append(date);
        commentList.append(item);
    });
    if (state.comments.length === 0) {
        const empty = document.createElement('li');
        empty.className = 'empty';
        empty.textContent = 'No comments yet.';
        commentList.append(empty);
    }

    // cookie viewer
    const lines = COOKIE_NAMES
        .filter((name) => getCookie(name) !== null)
        .map((name) => `${name} = ${getCookie(name)}`);
    cookieView.textContent = lines.length ? lines.join('\n') : '(no cookies saved)';
}

/* ---------- Like / Dislike ---------- */

function vote(choice) {
    if (state.vote) {
        voteStatus.textContent = `You already voted ${state.vote}. Press Reset to vote again.`;
        return;
    }

    state.vote = choice;
    if (choice === 'like') {
        state.likes += 1;
        setCookie('likes', state.likes);
    } else {
        state.dislikes += 1;
        setCookie('dislikes', state.dislikes);
    }
    setCookie('vote', choice);

    render();
    voteStatus.textContent = `Thanks! You voted ${choice}.`;

    // restart the "bump" animation on the count that changed
    const count = choice === 'like' ? likeCount : dislikeCount;
    count.classList.remove('bump');
    void count.offsetWidth;
    count.classList.add('bump');
}

likeBtn.addEventListener('click', () => vote('like'));
dislikeBtn.addEventListener('click', () => vote('dislike'));

/* ---------- Comment ---------- */

commentForm.addEventListener('submit', (event) => {
    event.preventDefault();

    if (hasCommented()) {
        commentStatus.textContent = 'You already left a comment. Press Reset to comment again.';
        return;
    }

    const text = commentInput.value.trim();
    if (text === '') {
        commentStatus.textContent = 'Please write a comment first.';
        commentInput.focus();
        return;
    }

    state.comments.push({ text, date: new Date().toISOString() });
    setCookie('comments', JSON.stringify(state.comments));
    commentInput.value = '';

    render();
    commentStatus.textContent = 'Your comment was saved.';
});

/* ---------- Reset ---------- */

resetBtn.addEventListener('click', () => {
    if (!confirm('Reset your vote and comment?')) return;

    COOKIE_NAMES.forEach(deleteCookie);
    state = { vote: null, likes: 0, dislikes: 0, comments: [] };
    commentInput.value = '';

    render();
    voteStatus.textContent = '';
    commentStatus.textContent = 'Your vote and comment were reset.';
});

/* ---------- Start ---------- */

cookieWarning.hidden = cookiesWork();
render();
if (state.vote) {
    voteStatus.textContent = `You voted ${state.vote}.`;
}
