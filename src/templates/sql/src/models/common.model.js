// ./src/models/common.models.js

// Common Response Object
const response = { data: null, error: null };

/* -------------------------------------------------------------------------- */
/*                            INSERT DATA FUNCTION                            */
/* -------------------------------------------------------------------------- */
exports.insertQuery = async (client, tbl, insertObj, returnData = "*") => {
    // defualt Object
    let obj = response;

    try {
        // Get all column keys
        const columns = Object.keys(insertObj).join(", ");

        // Get all column values
        const values = Object.values(insertObj).map((val, ind) => `$${ind + 1}`).join(", ");

        // SQL query
        let _sql = `INSERT INTO ${tbl} (${columns}) VALUES (${values})`;
        if (returnData) _sql += ` RETURNING ${returnData}`;

        // console.log(_sql, Object.values(insertObj), "=== insertQuery");

        // Run SQL query
        const { rows } = await client.query(_sql, Object.values(insertObj));
        obj.data = rows;

        return obj;
    } catch (error) {
        console.log(`Error occured insertQuery function: ${JSON.stringify({ message: error?.message, stack: error?.stack || "" })}`);
        obj.error = error;
    } finally {
        return obj;
    }
};


/* -------------------------------------------------------------------------- */
/*                            GET ALL DATA FUNCTION                           */
/* -------------------------------------------------------------------------- */
exports.getListQuery = async (client, tbl, query, fields = "*") => {
    // Default Object
    let obj = response;

    try {
        // SQL Query
        let _sql = `SELECT ${fields} FROM ${tbl}`;

        // Formating Query
        const formattedData = {};
        if (query) {
            let whereClause;
            if (typeof query === "object") {
                for (const [key, value] of Object.entries(query)) {
                    if (typeof value === "object" && value !== null) {
                        formattedData[key] = JSON.stringify(value);
                    } else {
                        formattedData[key] = value;
                    }
                };
                whereClause = Object.keys(query).map((key, ind) => `${key} = $${ind + 1}`).join(" AND ");
            };
            if (typeof query === "string") whereClause = query;

            _sql += ` WHERE ${whereClause};`;
        };

        // console.log(_sql, [...Object.values(formattedData)], "=== getListQuery");

        // Run SQL query
        const { rows } = await client.query(_sql, [...Object.values(formattedData)]);
        obj.data = rows;

        return obj;
    } catch (error) {
        console.log(`Error occured getListQuery function: ${JSON.stringify({ message: error?.message, stack: error?.stack || "" })}`);
        obj.error = error;
        return obj;
    } finally {
        return obj;
    }
};


/* -------------------------------------------------------------------------- */
/*                      GET DATA WITH PAGINATION FUNCTION                     */
/* -------------------------------------------------------------------------- */
exports.getPageListQuery = async (client, tbl, fields, whereClause, page = 1, limit = 10, search = "", colum, order) => {
    // Default Object
    let obj = response;

    try {
        const offset = (page - 1) * limit;
        const searchText = search?.replace(/\\/g, "\\\\").replace(/_/g, "\\_").replace(/%/g, "\\%") || "";
        const hasSearch = Boolean(searchText);

        let searchConditions = "";
        const searchParams = [];

        if (hasSearch) {
            const searchValue = `%${searchText}%`;
            searchConditions = colum.map((col, ind) => `${col} ILIKE $${ind + 1}`).join(" OR ");
            searchParams.push(...colum.map(() => searchValue));
        }

        const baseWhere = `${whereClause}${hasSearch ? ` AND (${searchConditions})` : ""}`;

        const query = `
                    WITH DataQuery AS (
                        SELECT ${fields}, ROW_NUMBER() OVER (ORDER BY ${order}) AS row_num
                        FROM ${tbl}
                        WHERE ${baseWhere}
                    )
                    SELECT (SELECT COUNT(*) FROM DataQuery) AS TotalRecord, *
                    FROM DataQuery
                    WHERE row_num BETWEEN $${searchParams.length + 1} AND $${searchParams.length + 2}`;
        const params = [...searchParams, offset + 1, offset + limit];

        // console.log(query, params, "=== getPageListQuery");

        const result = await client.query(query, params);
        obj.data = {
            total: Number(result.rows[0]?.totalrecord || 0),
            data: result.rows.map(row => {
                const { totalrecord, row_num, ...data } = row;
                return data;
            }),
        };

        return obj;
    } catch (error) {
        console.log(`Error occured getPageListQuery function: ${JSON.stringify({ message: error?.message, stack: error?.stack || "" })}`);
        obj.error = error;
        return obj;
    } finally {
        return obj;
    }
};


/* -------------------------------------------------------------------------- */
/*                            UPDATE DATA FUNCTION                            */
/* -------------------------------------------------------------------------- */
exports.updateQuery = async (client, tbl, query, updateObj, returnData = "*") => {
    // Deafult object
    let obj = response;

    try {
        const formattedData = {};
        for (const [key, value] of Object.entries(updateObj)) {
            if (typeof value === "object" && value !== null) {
                formattedData[key] = JSON.stringify(value);
            } else {
                formattedData[key] = value;
            }
        }

        // Set Value query
        const setClause = Object.keys(formattedData).map((key, index) => `${key} = $${index + 1}`).join(", ");

        // Where Clause query
        const whereClause = Object.keys(query).map((key, index) => `${key} = $${index + Object.keys(formattedData).length + 1}`).join(" AND ");

        let sql = `UPDATE ${tbl} SET ${setClause} WHERE ${whereClause}`;
        if (returnData) sql += ` RETURNING ${returnData}`;

        // console.log(sql, [...Object.values(formattedData), ...Object.values(query)], "=== updateQuery");

        const { rows } = await client.query(sql, [...Object.values(formattedData), ...Object.values(query)]);
        obj.data = rows;

        return obj;
    } catch (error) {
        console.log(`Error occured updateQuery function: ${JSON.stringify({ message: error?.message, stack: error?.stack || "" })}`);
        obj.error = error;
        return obj;
    } finally {
        return obj;
    }
};


/* -------------------------------------------------------------------------- */
/*                       PERMANENT DELETE DATA FUNCTION                       */
/* -------------------------------------------------------------------------- */
exports.deleteQuery = async (client, tbl, condition) => {
    // defualt Object
    let obj = response;

    try {
        // SQL Query
        let _sql = `DELETE FROM ${tbl}`;
        if (condition) _sql += ` WHERE ${condition}`;

        // console.log(_sql, "=== deleteQuery");

        const { rows } = await client.query(_sql);
        obj.data = rows;

        return obj;
    } catch (error) {
        console.log(`Error occured deleteQuery: ${JSON.stringify({ message: error?.message, stack: error?.stack || "" })}`);
        obj.error = error;
        return obj;
    } finally {
        return obj;
    }
};
