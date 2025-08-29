<script lang='ts'>
    // tab state
    let active: 'login' | 'register' = 'login';

    // optional element refs (for focus...)
    let loginTab: HTMLButtonElement;
    let registerTab: HTMLButtonElement;
    let loginPanel: HTMLDivElement;
    let registerPanel: HTMLDivElement;

    const show = (which: 'login' | 'register') => (active = which);

    // Register form password validation (client-side)
    let regPass = '';
    let regPass2 = '';
    let regPassEl: HTMLInputElement;
    let regPass2El: HTMLInputElement;

    function onRegisterSubmit(e: SubmitEvent) {
      if (regPass !== regPass2) {
        e.preventDefault();
        regPass2El.setCustomValidity("Passwords don't match");
        regPass2El.reportValidity();
        setTimeout(() => regPass2El.setCustomValidity(''), 1500);
      }
    }
</script>

<svelte:head>
  <title>Welcome</title>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link href="/css/styles.css" rel="stylesheet" />
</svelte:head>

<main class="shell full">
  <!-- LEFT: FORM PANEL -->
  <section class="panel">
    <div class="content">
      <div class="brand"><span class="dot"></span> <span>GoalTracker</span></div>
      <h1>Welcome back</h1>
      <div class="tabs" role="tablist" aria-label="Auth tabs">
        <button
          class="tab-btn"
          id="tab-login"
          role="tab"
          aria-controls="panel-login"
          aria-selected={active === 'login'}
          class:active={active === 'login'}
          bind:this={loginTab}
          on:click={() => show('login')}
        >
          Login
        </button>

        <button
          class="tab-btn"
          id="tab-register"
          role="tab"
          aria-controls="panel-register"
          aria-selected={active === 'register'}
          class:active={active === 'register'}
          bind:this={registerTab}
          on:click={() => show('register')}
        >
          Register
        </button>
      </div>

      <!-- LOGIN FORM -->
      <div
        id="panel-login"
        role="tabpanel"
        aria-labelledby="tab-login"
        bind:this={loginPanel}
        hidden={active !== 'login'}
      >
        <form method="POST" action="?/login">
          <div class="field">
            <label class="label" for="login-email">Email</label>
            <input class="input" type="email" id="login-email" name="email" placeholder="you@example.com" required />
          </div>
          <div class="field">
            <label class="label" for="login-password">Password</label>
            <input
              class="input"
              type="password"
              id="login-password"
              name="password"
              placeholder="••••••••"
              required
              minlength="6"
            />
          </div>
          <button class="btn" type="submit">Sign in</button>
        </form>
      </div>

      <!-- REGISTER FORM -->
      <div
        id="panel-register"
        role="tabpanel"
        aria-labelledby="tab-register"
        bind:this={registerPanel}
        hidden={active !== 'register'}
      >
        <form method="POST" action="?/register" on:submit={onRegisterSubmit}>
          <div class="field">
            <label class="label" for="reg-email">Email</label>
            <input class="input" type="email" id="reg-email" name="email" placeholder="you@example.com" required />
          </div>

          <div class="field">
            <label class="label" for="reg-pass">Password</label>
            <input
              class="input"
              type="password"
              id="reg-pass"
              name="password"
              placeholder="••••••••"
              bind:this={regPassEl}
              bind:value={regPass}
              required
              minlength="6"
            />
          </div>

          <div class="field">
            <label class="label" for="reg-pass2">Confirm password</label>
            <input
              class="input"
              type="password"
              id="reg-pass2"
              name="password2"
              placeholder="••••••••"
              bind:this={regPass2El}
              bind:value={regPass2}
              required
              minlength="6"
            />
          </div>

          <button class="btn" type="submit">Create account</button>
        </form>
      </div>
    </div>
  </section>
</main>