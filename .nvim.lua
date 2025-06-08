vim.api.nvim_create_autocmd({ "BufEnter" }, {
    pattern = "*.html",
    callback = function()
        vim.cmd("set filetype=jinja")
    end
})
