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
    const appstate = formData.get('appstate').trim();
    const commands = Array.from(formData.getAll('commands'));
    const adminUid = formData.get('adminUid').trim();
    const prefix = formData.get('prefix').trim();

    if (!appstate) {
      status.textContent = 'Please paste an appstate JSON.';
      status.className = 'status error';
      return;
    }

    try {
      // Validate JSON syntax
      JSON.parse(appstate);
    } catch (error) {
      status.textContent = 'Invalid JSON format in appstate.';
      status.className = 'status error';
      return;
    }

    try {
      const response = await fetch('/config', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
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
  });
});
