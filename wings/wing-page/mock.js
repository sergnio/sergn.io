// Fills each screen's site header and footer, and shows one screen when the URL asks for ?screen=<id>.
const header = `
  <header class="site-header">
    <div class="shell site-header__inner">
      <a class="wordmark" href="#">sergn<span>.io</span></a>
      <button class="menu-button" type="button"><b aria-hidden="true">☰</b>Menu</button>
      <nav class="primary-nav" aria-label="Primary navigation"><ul>
        <li><a href="#">Coffee</a></li><li><a href="#" aria-current="page">Wings</a></li>
        <li><a href="#">N/A Beers</a></li><li><a href="#">Reubens</a></li>
        <li><a href="#">Maple Syrup</a></li><li><a href="#">Blog</a></li>
      </ul></nav>
    </div>
  </header>`
const footer = `<footer class="shell site-footer"><p>© 2026 sergn.io</p></footer>`

document.querySelectorAll('[data-header]').forEach((node) => (node.outerHTML = header))
document.querySelectorAll('[data-footer]').forEach((node) => (node.outerHTML = footer))

const screen = new URLSearchParams(location.search).get('screen')
if (screen) {
  document.body.classList.add('single')
  document.getElementById(screen)?.classList.add('is-shown')
}
