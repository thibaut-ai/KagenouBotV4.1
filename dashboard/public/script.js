document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('configForm');
  const status = document.getElementById('status');
  const commandsSelect = document.getElementById('commands');

  // Fetch and populate commands dynamically
  fetch('/commands')
    .then(response => response.json())
    .then(commandNames => {
      commandNames.forEach(cmd => {
        const option = document.createElement('option');
        option.value = cmd;
        option.textContent = cmd;
        commandsSelect.appendChild(option);
      });
    })
    .catch(error => {
      console.error('Error fetching commands:', error);
      // Fallback to a default list if fetch fails
      const fallbackCommands = ['admin', 'python', 'quiz', 'help'];
      fallbackCommands.forEach(cmd => {
        const option = document.createElement('option');
        option.value = cmd;
        option.textContent = cmd;
        commandsSelect.appendChild(option);
      });
    });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const appstateFile = formData.get('appstate');
    const commands = Array.from(formData.getAll('commands'));
    const adminUid = formData.get('adminUid').trim();
    const prefix = formData.get('prefix').trim();

    if (!appstateFile) {
      status.textContent = 'Please upload an appstate file.';
      status.className = 'status error';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const appstate = e.target.result;
      try {
        const response = await fetch('/config', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            appstate,
            commands,
            adminUid,
            prefix
          })
        });

        const result = await response.text();
        if (response.ok) {
          status.textContent = result;
          status.className = 'status success';
        } else {
          throw new Error(result);
        }
      } catch (error) {
        status.textContent = `Error: ${error.message}`;
        status.className = 'status error';
      }
    };
    reader.readAsText(appstateFile);
  });
});
