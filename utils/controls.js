// 保留 select 的值、change 事件和标签，使用可键盘操作的独立浮层展示选项。
export function initSelects() {
  let active = null;
  const close = () => {
    if (!active) return;
    active.trigger.setAttribute('aria-expanded', 'false');
    active.trigger.removeAttribute('aria-activedescendant');
    active.menu.remove();
    active = null;
  };
  document.querySelectorAll('select').forEach(select => {
    const label = select.closest('label');
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'select-trigger';
    trigger.id = select.id + '-trigger';
    trigger.setAttribute('role', 'combobox');
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', select.id + '-menu');
    trigger.setAttribute('aria-label', label.querySelector('span').textContent);
    label.htmlFor = trigger.id;
    select.classList.add('native-select');
    select.tabIndex = -1;
    select.setAttribute('aria-hidden', 'true');
    select.after(trigger);
    const sync = () => {
      trigger.textContent = select.selectedOptions[0]?.textContent || '';
      trigger.disabled = select.disabled;
    };
    sync();
    select.addEventListener('change', sync);
    let buffer = '';
    let bufferTimer;
    const open = () => {
      close();
      const menu = document.createElement('div');
      menu.className = 'select-menu';
      menu.id = select.id + '-menu';
      menu.setAttribute('role', 'listbox');
      menu.setAttribute('aria-label', trigger.getAttribute('aria-label'));
      const options = Array.from(select.options);
      let index = select.selectedIndex;
      let items;
      const focus = next => {
        if (next < 0 || next >= options.length || options[next].disabled) return;
        index = next;
        items.forEach((item, i) => item.classList.toggle('active', i === index));
        trigger.setAttribute('aria-activedescendant', items[index].id);
        const itemTop = items[index].offsetTop;
        const itemBottom = itemTop + items[index].offsetHeight;
        if (itemTop < menu.scrollTop) menu.scrollTop = itemTop;
        else if (itemBottom > menu.scrollTop + menu.clientHeight) menu.scrollTop = itemBottom - menu.clientHeight;
      };
      const choose = () => {
        if (options[index]?.disabled) return;
        select.selectedIndex = index;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        close();
        trigger.focus();
      };
      items = options.map((option, i) => {
        const item = document.createElement('div');
        item.className = 'select-option';
        item.id = select.id + '-option-' + i;
        item.setAttribute('role', 'option');
        item.setAttribute('aria-selected', String(i === select.selectedIndex));
        item.setAttribute('aria-disabled', String(option.disabled));
        item.textContent = option.textContent;
        item.addEventListener('pointermove', () => focus(i));
        item.addEventListener('pointerdown', event => event.preventDefault());
        item.addEventListener('click', event => {
          event.stopPropagation();
          focus(i);
          if (i === index) choose();
        });
        menu.append(item);
        return item;
      });
      (trigger.closest('dialog[open]') || document.body).append(menu);
      const rect = trigger.getBoundingClientRect();
      const below = innerHeight - rect.bottom - 10;
      const above = rect.top - 10;
      const upward = below < Math.min(menu.scrollHeight, 240) && above > below;
      menu.style.maxHeight = Math.max(50, Math.min(280, upward ? above : below)) + 'px';
      menu.style.width = Math.min(innerWidth - 16, Math.max(rect.width, 165)) + 'px';
      menu.style.left = Math.max(8, Math.min(rect.left, innerWidth - menu.offsetWidth - 8)) + 'px';
      menu.style.top = (upward ? rect.top - menu.offsetHeight - 5 : rect.bottom + 5) + 'px';
      active = { trigger, menu, options, focus, choose, index: () => index };
      trigger.setAttribute('aria-expanded', 'true');
      focus(index);
    };
    trigger.addEventListener('click', event => {
      event.preventDefault();
      if (active?.trigger === trigger) close(); else open();
    });
    trigger.addEventListener('keydown', event => {
      const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', ' ', 'Escape', 'Tab'];
      if (event.key === 'Tab') { close(); return; }
      if (event.key === 'Escape') {
        if (active) { event.preventDefault(); event.stopPropagation(); close(); }
        return;
      }
      if (keys.includes(event.key)) {
        event.preventDefault();
        if (active?.trigger !== trigger) { open(); return; }
        if (event.key === 'Enter' || event.key === ' ') { active.choose(); return; }
        const step = event.key === 'ArrowUp' || event.key === 'End' ? -1 : 1;
        let next = event.key === 'Home' ? 0 : event.key === 'End' ? active.options.length - 1 : active.index() + step;
        while (active.options[next]?.disabled) next += step;
        active.focus(next);
      } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        if (active?.trigger !== trigger) open();
        buffer += event.key.toLocaleLowerCase();
        clearTimeout(bufferTimer);
        bufferTimer = setTimeout(() => { buffer = ''; }, 650);
        const next = active.options.findIndex(option => !option.disabled && option.textContent.toLocaleLowerCase().startsWith(buffer));
        active.focus(next);
      }
    });
  });
  document.addEventListener('pointerdown', event => {
    if (active && !active.menu.contains(event.target) && !active.trigger.contains(event.target)) close();
  });
  document.addEventListener('focusin', event => {
    if (active && event.target !== active.trigger && !active.menu.contains(event.target)) close();
  });
  document.addEventListener('scroll', event => {
    if (active && event.target !== active.menu && !active.menu.contains(event.target)) close();
  }, true);
  window.addEventListener('resize', close);
  return close;
}
