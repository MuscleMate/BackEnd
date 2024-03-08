const { StatusCodes } = require("http-status-codes");
const getTournaments = async (req, res) => {
    const userId = req.params.userId;
    // Get the tournaments from the database
    const tournaments = await Tournament.find({ userid: userId });

    try {
        // Send the tournaments as a response
        res.status(StatusCodes.OK).json(tournaments);
    } catch (error) {
        // Handle any errors that occur
        res.status(StatusCodes.BAD_REQUEST).json({ error: 'Failed to retrieve tournaments' });
    }
};

module.exports = {
    getTournaments,
};