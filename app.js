const supabaseUrl = 'https://jqdamomzbbdqesefauqo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxZGFtb216YmJkcWVzZWZhdXFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzNDkwODYsImV4cCI6MjA2MDkyNTA4Nn0.VbjqqW3qV1gTA8uDblBgQgNx98zryiGwgu72DCmmwkQ';
const { createClient } = supabase;
const supabaseClient = createClient(supabaseUrl, supabaseKey);

let user = null;
let currentModule = null;

async function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) return alert(error.message);

  const { data: { user: currentUser } } = await supabaseClient.auth.getUser();
  user = currentUser;
  showApp();
}

async function signup() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const { error } = await supabaseClient.auth.signUp({ email, password });
  if (error) return alert(error.message);
  alert("Cadastro realizado. Agora entre com seu login.");
}

window.addEventListener('DOMContentLoaded', async () => {
  const { data: { user: currentUser } } = await supabaseClient.auth.getUser();
  if (currentUser) {
    user = currentUser;
    showApp();
  }
});

async function logout() {
  await supabaseClient.auth.signOut();
  location.reload();
}

function showApp() {
  document.getElementById('login-container').style.display = 'none';
  document.getElementById('app-container').style.display = 'block';
  loadModules();
}

async function loadModules() {
  const { data, error } = await supabaseClient.from('notas').select('modulo').eq('user_id', user.id);
  if (error) return console.error(error);
  const select = document.getElementById('modules-select');
  select.innerHTML = '<option value="">Selecione...</option>';
  const uniqueModules = [...new Set(data.map(d => d.modulo))];
  uniqueModules.forEach(mod => {
    const option = document.createElement('option');
    option.value = mod;
    option.textContent = mod;
    select.appendChild(option);
  });
}

function onModuleSelect() {
  const mod = document.getElementById('modules-select').value;
  if (mod) {
    loadNote(mod);
  }
}

async function loadNote(mod) {
  currentModule = mod;
  const { data, error } = await supabaseClient
    .from('notas')
    .select('conteudo')
    .eq('user_id', user.id)
    .eq('modulo', mod)
    .single();
  document.getElementById('note-content').value = data?.conteudo || '';
}

async function saveNote() {
  const content = document.getElementById('note-content').value;
  if (!currentModule) return alert("Selecione um módulo");
  const { error } = await supabaseClient
    .from('notas')
    .upsert({ user_id: user.id, modulo: currentModule, conteudo: content });
  if (error) alert("Erro ao salvar");
  else alert("Salvo com sucesso!");
}

async function addModule() {
  const name = document.getElementById('new-module-name').value;
  if (!name) return alert("Digite o nome do módulo");

  // Cria módulo vazio diretamente no Supabase
  const { error } = await supabaseClient
    .from('notas')
    .upsert({ user_id: user.id, modulo: name, conteudo: "" });

  if (error) return alert("Erro ao adicionar módulo");

  currentModule = name;
  document.getElementById('modules-select').value = name;
  document.getElementById('note-content').value = "";
  loadModules();
}
