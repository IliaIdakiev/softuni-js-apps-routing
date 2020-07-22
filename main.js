(function () {

  const templates = {};
  const loadingBoxEl = document.getElementById('loadingBox');
  const infoBoxEl = document.getElementById('infoBox');
  const errorBoxEl = document.getElementById('errorBox');

  // https://test-app-76aaf.firebaseio.com/users/5.json

  const firebaseConfig = {
    apiKey: "AIzaSyAaHp-dogZwgizGz0lFe1t0BXRrPcUc_SU",
    authDomain: "test-app-f0c08.firebaseapp.com",
    databaseURL: "https://test-app-f0c08.firebaseio.com",
    projectId: "test-app-f0c08",
    storageBucket: "test-app-f0c08.appspot.com",
    messagingSenderId: "258632138557",
    appId: "1:258632138557:web:c05710ffa8f69fce95cf54",
    measurementId: "G-L8LXEHBLFG"
  };
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  firebase.analytics();

  function toggleLoader(showLoader) {
    if (showLoader) {
      loadingBoxEl.style.display = 'inline';
      return;
    }
    loadingBoxEl.style.display = 'none';
  }

  function getTemplate(templatePath) {
    const existingTemplate = templates[templatePath];
    if (existingTemplate) { return Promise.resolve(existingTemplate); }
    return fetch(`/templates/${templatePath}.hbs`).then(res => res.text()).then(templateString => {
      const template = Handlebars.compile(templateString);
      templates[templatePath] = template;
      return template;
    });
  }

  function renderTemplate(templatePath, templateContext, swapFn) {
    return getTemplate(templatePath).then(templateFn => {
      const content = templateFn(templateContext)
      swapFn(content);
    });
  }

  function loadRegisterPartialTemplate(templatePath, templateName) {
    return fetch(`/templates/partials/${templatePath}.hbs`).then(res => res.text()).then(templateStr => {
      Handlebars.registerPartial(templateName, templateStr);
      return templateStr;
    });
  }

  function loadFurniture() {
    return fetch(`${firebaseConfig.databaseURL}/furniture.json`)
      .then(res => res.json())
      .then(data => {
        return Object.keys(data).reduce((acc, currId) => {
          const currentItem = data[currId];
          return acc.concat({ id: currId, ...currentItem });
        }, [])
      })
  }

  function loadFurnitureWithId(id) {
    return fetch(`${firebaseConfig.databaseURL}/furniture/${id}.json`)
      .then(res => res.json());
  }

  const app = Sammy('#container', function () {

    this.before({}, function () {
      toggleLoader(true);
    });

    this.get('#/', function () {
      Promise.all([loadFurniture(), loadRegisterPartialTemplate('furniture-item', 'furnitureItem')])
        .then(([items]) => renderTemplate('home', { items }, this.swap.bind(this)))
        .then(() => {
          toggleLoader(false);
        });
    });

    this.get('#/profile', function () {
      renderTemplate('profile', {}, this.swap.bind(this))
        .then(() => {
          toggleLoader(false);
        });
    });

    this.get('#/create-furniture', function () {
      renderTemplate('create-furniture', {}, this.swap.bind(this))
        .then(() => {
          toggleLoader(false);
          const onCreateHandler = () => {
            const newMakeEl = document.getElementById('new-make');
            const newModelEl = document.getElementById('new-model');
            const newYearEl = document.getElementById('new-year');
            const newDescriptionEl = document.getElementById('new-description');
            const newPriceEl = document.getElementById('new-price');
            const newImageEl = document.getElementById('new-image');
            const newMaterialEl = document.getElementById('new-material');

            const inputs = [
              newMakeEl,
              newModelEl,
              newYearEl,
              newDescriptionEl,
              newPriceEl,
              newImageEl,
              newMaterialEl,
            ];

            const values = inputs.map(input => input.value);
            const missingInputValue = values.findIndex(v => !v);
            if (missingInputValue !== -1) {
              console.error('MISSING DATA', inputs[missingInputValue]);
              return;
            }

            const body = values.reduce((acc, curr, index) => {
              const currentInputEl = inputs[index];
              acc[currentInputEl.name] = curr;
              return acc;
            }, {});

            const url = `${firebaseConfig.databaseURL}/furniture.json`;
            fetch(url, { method: 'POST', body: JSON.stringify(body) }).then(() => {
              this.redirect('#/');
            });
          }

          const createBtn = document.getElementById('create-btn');

          createBtn.addEventListener('click', onCreateHandler);
        });
    });

    this.get('#/furniture-detail/:id', function (context) {
      const id = context.params.id;
      loadFurnitureWithId(id)
        .then(furniture => renderTemplate('furniture-detail', { furniture }, this.swap.bind(this)))
        .then(() => {
          toggleLoader(false);
        });
    });

  });

  app.run('#/');
}());
