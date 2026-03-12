import streamlit as st
import os

st.set_page_config(
    page_title="Red Ball - 2D Platform Oyunu",
    page_icon="🔴",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Hide Streamlit UI elements for full-screen game experience
st.markdown("""
<style>
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}
    .block-container {
        padding: 0 !important;
        max-width: 100% !important;
    }
    iframe {
        border: none !important;
    }
    .stApp {
        background: #0d1117;
    }
</style>
""", unsafe_allow_html=True)

# Read the game files
base_dir = os.path.dirname(os.path.abspath(__file__))

with open(os.path.join(base_dir, "style.css"), "r", encoding="utf-8") as f:
    css_content = f.read()

with open(os.path.join(base_dir, "game.js"), "r", encoding="utf-8") as f:
    js_content = f.read()

with open(os.path.join(base_dir, "index.html"), "r", encoding="utf-8") as f:
    html_content = f.read()

# Replace external file references with inline content
# Replace CSS link with inline style
html_content = html_content.replace(
    '<link rel="stylesheet" href="style.css">',
    f'<style>{css_content}</style>'
)

# Replace JS script src with inline script
html_content = html_content.replace(
    '<script src="game.js"></script>',
    f'<script>{js_content}</script>'
)

# Render the game
st.components.v1.html(html_content, height=800, scrolling=False)
