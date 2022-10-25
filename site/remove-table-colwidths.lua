-- Remove all of the column width data from tables. This is because we like using pipetables
-- (since VSCode extensions understand it), but pandoc attempts to infer column widths from
-- the raw text, which is meaningless for us as they often contain latex, which when rendered
-- is much smaller.

function Table(el)
    for i = 1, #el.colspecs do
        el.colspecs[i][2] = nil
    end
    return el
end
