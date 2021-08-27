-- Read base_url to here, should be something like "/lievis/"
base_url = nil
return {
    -- These two groups of filters run in order (if we put them together, the Meta
    -- filter would be run after the Link filter).
    {
        Meta = function (meta)
            base_url = meta["base_url"]:gsub("(.)%/$", "%1") or base_url
        end
    },
    {
        Link = function (elem)
            if string.find(elem.target, "^/") and base_url then
                elem.target = base_url .. elem.target
            end
            return elem
        end
    }
}
