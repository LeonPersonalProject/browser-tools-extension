// Memory only: one receiver, 30-second expiry, no storage or URL payload.
const transfers = new Map();
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (sender.id !== chrome.runtime.id) return;
  if (message?.type === 'candy-open' && sender.url?.startsWith(chrome.runtime.getURL(''))) {
    (async () => {
      const tab = await chrome.tabs.create({ url: 'about:blank' });
      transfers.set(tab.id, message.state);
      setTimeout(() => transfers.delete(tab.id), 30000);
      await chrome.tabs.update(tab.id, { url: chrome.runtime.getURL('fullpage.html') });
      respond({ success: true });
    })().catch(() => respond({ success: false }));
    return true;
  }
  if (message?.type === 'candy-transfer' && sender.tab && sender.url === chrome.runtime.getURL('fullpage.html')) {
    const state = transfers.get(sender.tab.id);
    transfers.delete(sender.tab.id);
    respond(state || null);
  }
});
chrome.tabs.onRemoved.addListener(id => transfers.delete(id));
