def test_science_imports():
    import numpy, pandas, scipy, sklearn, rasterio, geopandas  # noqa: F401
    import science

    assert science.__doc__
